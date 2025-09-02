-- Create a test installment sale to verify the system is working
INSERT INTO public.vendas (
    id,
    user_id,
    cliente_id,
    valor,
    data_venda,
    status,
    forma_pagamento,
    parcelas
) VALUES (
    gen_random_uuid(),
    (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1),
    (SELECT id FROM public.clientes LIMIT 1),
    3000.00,
    '2025-09-02',
    'fechada',
    'parcelado',
    3
) RETURNING id;