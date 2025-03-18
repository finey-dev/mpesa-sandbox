export default function PaymentSuccess() {
  return (
    <div className="space-y-2 text-center text-black p-10 bg-gray-100">
      <h1>Your Payment was processed successfully</h1>
      <h1>Thank you for testing the MPESA API Intergration Project</h1>
      <p className="mt-4">
        Contact me for more information or to get an implementation that suits your business application
        and needs:
      </p>
      <a
        href="https://wa.me/254705980545"
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 underline">
        Click to chat with me on WhatsApp
      </a>
    </div>
  );
}
