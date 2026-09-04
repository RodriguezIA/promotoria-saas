import { LegalPageLayout, LegalH2, LegalP, LegalUl, LegalPlaceholder } from "./LegalPageLayout"

export function Terminos() {
  return (
    <LegalPageLayout title="Términos y Condiciones de Uso" updated="[FECHA]">
      <LegalH2>1. Aceptación de los términos</LegalH2>
      <LegalP>
        Al registrarse y utilizar la aplicación Promotoria como promotor, usted acepta estos
        Términos y Condiciones en su totalidad. Si no está de acuerdo, no debe utilizar la
        aplicación.
      </LegalP>

      <LegalH2>2. Identidad del titular</LegalH2>
      <LegalP><LegalPlaceholder>Razón social o nombre completo del titular de Promotoria</LegalPlaceholder></LegalP>
      <LegalP><LegalPlaceholder>RFC</LegalPlaceholder></LegalP>
      <LegalP><LegalPlaceholder>Domicilio fiscal completo</LegalPlaceholder></LegalP>

      <LegalH2>3. Descripción del servicio</LegalH2>
      <LegalP>
        Promotoria es una plataforma que conecta a clientes empresariales que requieren la
        realización de tareas de exhibición, verificación o promoción de producto en tiendas
        físicas ("Tareas"), con personas interesadas en realizarlas a cambio de una compensación
        económica ("Promotores").
      </LegalP>

      <LegalH2>4. Registro y elegibilidad</LegalH2>
      <LegalUl>
        <li>Debe proporcionar información veraz, actual y completa al registrarse.</li>
        <li>Es responsable de mantener la confidencialidad de su contraseña.</li>
        <li>Debe ser mayor de edad conforme a la legislación mexicana para poder registrarse y recibir pagos.</li>
      </LegalUl>

      <LegalH2>5. Datos bancarios y pagos</LegalH2>
      <LegalP>
        Los datos de su cuenta bancaria (CLABE o número de tarjeta) que registre en la
        aplicación se almacenan cifrados con el algoritmo AES-256. Nunca se muestran de forma
        completa en la aplicación ni en el panel administrativo; solo se exhiben los últimos 4
        dígitos. El número completo únicamente puede ser consultado, de forma temporal, por
        personal autorizado de Administración/Finanzas, exclusivamente para procesar su
        transferencia de pago, y dicha consulta queda registrada en una bitácora de auditoría
        (quién la consultó y en qué momento).
      </LegalP>
      <LegalP>
        Este número se recopila y cifra exclusivamente para realizar las transferencias manuales
        de sus pagos por tareas completadas.
      </LegalP>
      <LegalP>
        <LegalPlaceholder>Detallar plazos de pago, medio de pago (SPEI/transferencia), y cualquier comisión aplicable</LegalPlaceholder>
      </LegalP>

      <LegalH2>6. Ganancias por afiliación / referidos</LegalH2>
      <LegalP>
        <LegalPlaceholder>Detallar el esquema de comisiones por invitar a otros promotores, si aplica</LegalPlaceholder>
      </LegalP>

      <LegalH2>7. Uso de la ubicación</LegalH2>
      <LegalP>
        La aplicación recopila su ubicación geográfica en tiempo real mientras tiene una tarea
        activa asignada, con el fin de verificar que la tarea se realiza en la tienda
        correspondiente y de informar a los clientes empresariales la cobertura de promotores en
        cada zona.
      </LegalP>

      <LegalH2>8. Eliminación de su cuenta</LegalH2>
      <LegalP>
        Usted puede solicitar la eliminación permanente de su cuenta en cualquier momento, ya sea
        desde la sección "Mi Perfil" dentro de la aplicación, o desde nuestro sitio web, sin
        necesidad de tener la aplicación instalada, en:{" "}
        <a href="/eliminar-cuenta" className="text-primary font-medium underline">
          promotoriadigital.app/eliminar-cuenta
        </a>
      </LegalP>
      <LegalP>
        Al eliminar su cuenta: (a) sus datos de cuenta bancaria (CLABE/tarjeta) se borran
        físicamente y de forma irreversible de nuestros servidores; (b) su perfil se marca como
        dado de baja y se revoca el acceso de cualquier sesión activa; (c) su número de celular
        se conserva únicamente como identificador histórico, para no afectar la integridad de
        los registros contables de tareas y pagos ya efectuados — este dato no se utiliza para
        ningún otro fin una vez eliminada la cuenta.
      </LegalP>
      <LegalP>
        La eliminación de la cuenta no cancela pagos ya en trámite ni afecta obligaciones
        fiscales o contables ya generadas antes de la solicitud de baja.
      </LegalP>

      <LegalH2>9. Conducta del promotor</LegalH2>
      <LegalUl>
        <li>
          El promotor se compromete a realizar las tareas de forma honesta, evitando fraudes,
          evidencias falsas o manipulación de la información reportada.
        </li>
        <li>
          La plataforma se reserva el derecho de suspender o eliminar cuentas que incurran en
          conductas fraudulentas.
        </li>
      </LegalUl>

      <LegalH2>10. Propiedad intelectual</LegalH2>
      <LegalP>
        Todo el contenido, marca, diseño y software de Promotoria son propiedad de su titular y
        no pueden reproducirse sin autorización.
      </LegalP>

      <LegalH2>11. Limitación de responsabilidad</LegalH2>
      <LegalP>
        <LegalPlaceholder>Cláusula de limitación de responsabilidad — se recomienda redacción por abogado</LegalPlaceholder>
      </LegalP>

      <LegalH2>12. Modificaciones a estos Términos</LegalH2>
      <LegalP>
        Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios
        serán notificados a través de la aplicación y entrarán en vigor a partir de su
        publicación.
      </LegalP>

      <LegalH2>13. Ley aplicable y jurisdicción</LegalH2>
      <LegalP>
        <LegalPlaceholder>Ley aplicable y jurisdicción de tribunales competentes</LegalPlaceholder>
      </LegalP>

      <LegalH2>14. Aviso de Privacidad</LegalH2>
      <LegalP>
        El tratamiento de sus datos personales se rige por nuestro Aviso de Privacidad,
        disponible en:{" "}
        <a href="/aviso-de-privacidad" className="text-primary font-medium underline">
          promotoriadigital.app/aviso-de-privacidad
        </a>
      </LegalP>
    </LegalPageLayout>
  )
}
