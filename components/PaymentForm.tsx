"use client";
import { sendStkPush } from "@/actions/stkPush";
import { stkPushQuery } from "@/actions/stkPushQuery";
import { useState } from "react";
import Snackbar from "./Snackbar";
import STKPushQueryLoading from "./StkQueryLoading";
import PaymentSuccess from "./Success";

interface dataFromForm {
  mpesa_phone: string;
  name: string;
  amount: number | null;
}

interface SnackbarState {
  show: boolean;
  message: string;
  type: "success" | "error";
}

function PaymentForm() {
  const [dataFromForm, setDataFromForm] = useState<dataFromForm>({
    mpesa_phone: "",
    name: "",
    amount: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [stkQueryLoading, setStkQueryLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    show: false,
    message: "",
    type: "success",
  });

  const showSnackbar = (message: string, type: "success" | "error") => {
    setSnackbar({ show: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, show: false }));
  };

  const stkPushQueryWithIntervals = (CheckoutRequestID: string) => {
    let retryCount = 0;
    const maxRetries = 20;
    const interval = 3000;

    const timer = setInterval(async () => {
      retryCount += 1;

      if (retryCount === maxRetries) {
        clearInterval(timer);
        setStkQueryLoading(false);
        setLoading(false);
        showSnackbar("Payment request timed out. Please try again.", "error");
        return;
      }

      try {
        const { data, error } = await stkPushQuery(CheckoutRequestID);

        if (error) {
          if (error.response?.data?.errorCode === "500.001.1001") {
            await new Promise((resolve) => setTimeout(resolve, 5000));
            return;
          }
          clearInterval(timer);
          setStkQueryLoading(false);
          setLoading(false);
          showSnackbar(
            error?.response?.data?.errorMessage ||
              "An error occurred while checking payment status",
            "error"
          );
          return;
        }

        if (data) {
          if (data.ResultCode === "0") {
            clearInterval(timer);
            setStkQueryLoading(false);
            setLoading(false);
            setSuccess(true);
            showSnackbar("Payment successful!", "success");
          } else {
            clearInterval(timer);
            setStkQueryLoading(false);
            setLoading(false);
            showSnackbar(
              data?.ResultDesc || "Payment failed. Please try again.",
              "error"
            );
          }
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }, interval);
  };

  const handleSubmit = async () => {
    setLoading(true);

    const formData = {
      mpesa_number: dataFromForm.mpesa_phone.trim(),
      name: dataFromForm.name.trim(),
      amount: dataFromForm.amount!,
    };

    const kenyanPhoneNumberRegex =
      /^(07\d{8}|01\d{8}|2547\d{8}|2541\d{8}|\+2547\d{8}|\+2541\d{8})$/;

    if (!kenyanPhoneNumberRegex.test(formData.mpesa_number)) {
      setLoading(false);
      showSnackbar("Invalid mpesa number", "error");
      return;
    }

    const { data: stkData, error: stkError } = await sendStkPush(formData);

    if (stkError) {
      setLoading(false);
      showSnackbar(stkError, "error");
      return;
    }

    const checkoutRequestId = stkData.CheckoutRequestID;
    setStkQueryLoading(true);
    stkPushQueryWithIntervals(checkoutRequestId);
  };

  return (
    <>
      {stkQueryLoading ? (
        <STKPushQueryLoading number={dataFromForm.mpesa_phone} />
      ) : success ? (
        <PaymentSuccess />
      ) : (
        <div className="lg:pl-12">
          <div className="overflow-hidden rounded-md bg-white">
            <div className="p-6 sm:p-10">
              <p className="mt-4 text-base text-gray-600">
                Enter your name, mpesa number and amount to process and test
                this MPESA API Sandbox Project.
              </p>
              <form action="#" method="POST" className="mt-4">
                <div className="space-y-6">
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      {" "}
                      Name{" "}
                    </label>
                    <div className="relative mt-2.5">
                      <input
                        type="text"
                        required
                        name="name"
                        value={dataFromForm.name}
                        onChange={(e) =>
                          setDataFromForm({
                            ...dataFromForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="John Doe"
                        className="block w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-black placeholder-gray-500 caret-orange-500 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      {" "}
                      Mpesa Number{" "}
                    </label>
                    <div className="relative mt-2.5">
                      <input
                        type="text"
                        name="mpesa_number"
                        value={dataFromForm.mpesa_phone}
                        onChange={(e) =>
                          setDataFromForm({
                            ...dataFromForm,
                            mpesa_phone: e.target.value,
                          })
                        }
                        placeholder="Enter mpesa phone number"
                        className="block w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-black placeholder-gray-500 caret-orange-500 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-base font-medium text-gray-900">
                      {" "}
                      Amount{" "}
                    </label>
                    <div className="relative mt-2.5">
                      <input
                        type="number"
                        required
                        name="amount"
                        value={dataFromForm.amount ?? ""}
                        onChange={(e) =>
                          setDataFromForm({
                            ...dataFromForm,
                            amount: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        placeholder="Enter amount"
                        className="block w-full rounded-md border border-gray-200 bg-white px-4 py-4 text-black placeholder-gray-500 caret-orange-500 transition-all duration-200 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-orange-500 px-4 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-orange-600 focus:bg-orange-600 focus:outline-none">
                      {loading ? "Processing.." : "Proceed With Payment"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {snackbar.show && (
        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          onClose={hideSnackbar}
        />
      )}
    </>
  );
}

export default PaymentForm;
