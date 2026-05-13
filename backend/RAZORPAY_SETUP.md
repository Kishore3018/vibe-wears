# Razorpay Setup (Vibe Wears)

This project already has Razorpay checkout integrated in:
- Backend: `backend/routers/payments.py`
- Frontend: `frontend/src/app/core/services/payment.service.ts`
- Checkout flow: `frontend/src/app/pages/checkout/checkout.component.ts`

## 1) Configure keys

Open `backend/.env` and set:

```
PAYMENT_DEMO_MODE=false
RAZORPAY_KEY_ID=rzp_live_or_test_from_dashboard
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Notes:
- Use `rzp_test_*` keys for test transactions.
- Use `rzp_live_*` keys only in production.
- When `PAYMENT_DEMO_MODE=true`, checkout runs in demo mode and no real charge happens.

## 2) Install backend dependencies

From `backend`:

```
pip install -r requirements.txt
```

`razorpay==1.4.2` is already listed in `requirements.txt`.

## 3) Start backend and frontend

Backend:

```
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Frontend:

```
npm run start
```

## 4) Verify integration

- Place an order using any online method (UPI/card/netbanking/wallet).
- Razorpay modal should open.
- On success, backend verifies signature at `POST /api/payments/verify`.
- Order payment status should move to `completed`.

## 5) Common issues

- Error: "Razorpay is in live mode but credentials are missing"
  - Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`.

- Error: "Razorpay SDK is unavailable"
  - Reinstall dependencies in backend environment.

- Payment opens but fails immediately
  - Confirm key pair matches mode (test with test, live with live).
