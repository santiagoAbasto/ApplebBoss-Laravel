import { Head } from '@inertiajs/react';
import StoreLayout from '@/Layouts/StoreLayout';
import { Aviso, FormularioEntrar, PaginaCuenta, TarjetaCuenta, TituloCuenta } from '@/Components/Store/CuentaUI';

// /ingresar: la misma tarjeta del modal «Acceder», como página. A ella llegan el checkout sin sesión, Google con un
// error y quien acaba de cambiar su contraseña.
function EntrarTienda({ status, desdeCheckout = false }) {
    return (
        <>
            <Head title="Entrar a tu cuenta" />
            <PaginaCuenta>
                <TarjetaCuenta titulo={<TituloCuenta as="h1">Tu cuenta Apple Boss</TituloCuenta>}
                    subtitulo={desdeCheckout
                        ? 'Para comprar entra a tu cuenta: tu pedido queda a tu nombre y lo sigues cuando quieras.'
                        : 'Sigue tus pedidos, califica tus compras y paga más rápido.'}>
                    <Aviso>{status}</Aviso>
                    <FormularioEntrar enfocar />
                </TarjetaCuenta>
            </PaginaCuenta>
        </>
    );
}

export default function Entrar(props) {
    return <StoreLayout><EntrarTienda {...props} /></StoreLayout>;
}
