"use server";

import axios from "axios";

interface Params {
  mpesa_number: string;
  name: string;
  amount: number;
}

export const sendStkPush = async (body: Params) => {
  const mpesaEnv = process.env.MPESA_ENVIRONMENT;
  // const MPESA_BASE_URL =
  //   mpesaEnv === "live"
  //     ? "https://api.safaricom.co.ke"
  //     : "https://sandbox.safaricom.co.ke";
  const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";

  const { mpesa_number: phoneNumber, name, amount } = body;
  try {
    //generate authorization token
    const auth: string = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString("base64");

    const resp = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    );

    const token = resp.data.access_token;

    // Simpler phone number formatting
    let formattedPhone = "";
    // Remove any non-digit characters
    const digits = phoneNumber
      .split("")
      .filter((char) => /\d/.test(char))
      .join("");

    // Handle different formats
    if (digits.startsWith("254")) {
      formattedPhone = digits;
    } else if (digits.startsWith("0")) {
      formattedPhone = "254" + digits.substring(1);
    } else {
      formattedPhone = "254" + digits;
    }

    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);

    const password: string = Buffer.from(
      process.env.MPESA_SHORTCODE! + process.env.MPESA_PASSKEY + timestamp
    ).toString("base64");

    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL:
          process.env.MPESA_CALLBACK_URL ||
          "https://mydomain.com/callback-url-path",
        AccountReference: process.env.MPESA_ACCOUNT_NUMBER,
        TransactionDesc: "Transaction to the Sanbox Environment was successful",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return { data: response.data };
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      return { error: error.message };
    }
    return { error: "something wrong happened" };
  }
};
