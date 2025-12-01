import axios from "axios";
import { API } from "@/utils/api";   // make sure this file exists!

handler: async (response: any) => {
  try {
    // 1️⃣ VERIFY PAYMENT
    await axios.post(`${API}/api/payment/verify-payment`, response);

    // 2️⃣ CREATE ORDER IN DATABASE
    await axios.post(`${API}/api/order/create`, {
      name: checkoutForm.name,
      email: checkoutForm.email,
      phone: checkoutForm.phone,
      address: checkoutForm.address,
      city: checkoutForm.city,
      zip: checkoutForm.zip,

      amount,
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      signature: response.razorpay_signature,

      status: "PAID",
      items: cartItems, // Make sure this exists
    });

    alert("Order Placed Successfully!");
  } catch (error) {
    console.error(error);
    alert("Payment verified but order creation failed.");
  }
};
