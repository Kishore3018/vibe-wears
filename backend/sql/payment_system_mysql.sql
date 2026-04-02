-- Payment System Schema (MySQL 8+)
-- Tables requested:
-- 1) orders (id, user_id, amount, status, created_at)
-- 2) payments (id, order_id, payment_id, status, signature)

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_orders_user_id (user_id),
    KEY idx_orders_status (status),
    KEY idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    payment_id VARCHAR(120) NOT NULL,
    status ENUM('pending', 'captured', 'failed') NOT NULL DEFAULT 'pending',
    signature VARCHAR(255) NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_payments_payment_id (payment_id),
    KEY idx_payments_order_id (order_id),
    KEY idx_payments_status (status),
    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Update order status after payment verification
-- ------------------------------------------------------------
-- When verification is successful:
--   - payment.status -> captured
--   - orders.status  -> success
-- When verification fails:
--   - payment.status -> failed
--   - orders.status  -> failed

-- Success flow (run after signature verification succeeds)
START TRANSACTION;

UPDATE payments
SET status = 'captured',
    signature = :razorpay_signature
WHERE payment_id = :razorpay_payment_id;

UPDATE orders o
JOIN payments p ON p.order_id = o.id
SET o.status = 'success'
WHERE p.payment_id = :razorpay_payment_id;

COMMIT;

-- Failure flow (run when verification fails)
START TRANSACTION;

UPDATE payments
SET status = 'failed',
    signature = :razorpay_signature
WHERE payment_id = :razorpay_payment_id;

UPDATE orders o
JOIN payments p ON p.order_id = o.id
SET o.status = 'failed'
WHERE p.payment_id = :razorpay_payment_id;

COMMIT;
