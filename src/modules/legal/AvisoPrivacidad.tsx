import { LegalPageLayout, LegalH2, LegalH3, LegalP, LegalUl, LegalPlaceholder } from "./LegalPageLayout"

export function AvisoPrivacidad() {
  return (
    <LegalPageLayout title="Aviso de Privacidad" updated="[FECHA]">
      <LegalP>
        Con fundamento en los artículos 15 y 16 de la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares (LFPDPPP) y demás disposiciones aplicables,
        ponemos a su disposición el presente Aviso de Privacidad.
      </LegalP>

      <LegalH2>1. Responsable del tratamiento de datos personales</LegalH2>
      <LegalP><LegalPlaceholder>Razón social o nombre completo del titular de Promotoria</LegalPlaceholder></LegalP>
      <LegalP><LegalPlaceholder>RFC</LegalPlaceholder></LegalP>
      <LegalP><LegalPlaceholder>Domicilio fiscal completo</LegalPlaceholder></LegalP>
      <LegalP>Correo de contacto para temas de privacidad: <LegalPlaceholder>correo de contacto</LegalPlaceholder></LegalP>

      <LegalH2>2. ¿Qué datos personales recabamos?</LegalH2>
      <LegalP>
        Recabamos los siguientes datos personales, directamente de usted, a través de la
        aplicación móvil de promotores y del panel web:
      </LegalP>

      <LegalH3>2.1 Datos de identificación y contacto</LegalH3>
      <LegalUl>
        <li>Nombre y apellido</li>
        <li>Número de celular (usado como identificador de inicio de sesión)</li>
        <li>Correo electrónico (opcional)</li>
        <li>Fotografía de perfil</li>
      </LegalUl>

      <LegalH3>2.2 Datos de ubicación</LegalH3>
      <LegalUl>
        <li>
          Ubicación geográfica (GPS) en tiempo real, únicamente mientras usted tiene una tarea
          activa asignada, para verificar la cobertura de zonas y mostrar a los clientes
          empresariales qué promotores están cubriendo cada tienda.
        </li>
      </LegalUl>

      <LegalH3>2.3 Datos financieros</LegalH3>
      <LegalUl>
        <li>
          CLABE interbancaria o número de tarjeta, y nombre del banco, exclusivamente para poder
          realizar el depósito de sus pagos por tareas completadas.
        </li>
      </LegalUl>
      <LegalP>
        Estos datos se cifran con el algoritmo AES-256 antes de guardarse en nuestros servidores.
        Nunca se muestran completos en la aplicación ni en el panel administrativo — solo se ven
        los últimos 4 dígitos. El número completo solo puede ser consultado, de forma temporal y
        bajo un registro de auditoría, por personal autorizado de administración/finanzas, y
        únicamente para procesar su transferencia de pago.
      </LegalP>

      <LegalH3>2.4 Datos de la actividad en la plataforma</LegalH3>
      <LegalUl>
        <li>Historial de tareas realizadas, calificaciones, ganancias y comisiones</li>
        <li>Fotografías tomadas como evidencia del cumplimiento de una tarea</li>
        <li>Código de invitación y datos de las personas que usted invita a la plataforma (referidos)</li>
        <li>Identificador de notificaciones push (para avisarle de nuevas tareas)</li>
      </LegalUl>

      <LegalH3>2.5 Contraseña</LegalH3>
      <LegalP>
        Su contraseña se guarda utilizando una técnica de "hash" (bcrypt) que la hace
        irreversible — ni siquiera nuestro propio personal puede verla en texto plano.
      </LegalP>

      <LegalH2>3. ¿Para qué fines utilizamos sus datos personales?</LegalH2>
      <LegalP>
        Sus datos personales serán utilizados para las siguientes finalidades, necesarias para
        el servicio que usted solicita:
      </LegalP>
      <LegalUl>
        <li>Crear y administrar su cuenta de promotor</li>
        <li>Asignarle tareas y verificar su cumplimiento en la ubicación correspondiente</li>
        <li>Calcular y procesar el pago de sus comisiones y ganancias</li>
        <li>Calcular las comisiones que le corresponden por invitar a otros promotores (afiliación)</li>
        <li>Enviarle notificaciones sobre nuevas tareas, pagos y avisos de la plataforma</li>
        <li>Atender aclaraciones, dudas o reportes relacionados con su cuenta</li>
        <li>Prevenir fraudes y verificar la identidad de quien solicita el pago o la baja de una cuenta</li>
      </LegalUl>
      <LegalP>
        No utilizamos sus datos financieros para ningún fin distinto al pago de sus comisiones.
        No vendemos ni rentamos sus datos personales a terceros.
      </LegalP>

      <LegalH2>4. Transferencia de datos</LegalH2>
      <LegalP>
        Sus datos de nombre y la evidencia de cumplimiento de una tarea pueden compartirse con el
        cliente empresarial que solicitó dicha tarea, únicamente para que pueda validar que el
        servicio se realizó correctamente. Sus datos financieros NUNCA se comparten con clientes
        empresariales.
      </LegalP>
      <LegalP>
        Utilizamos proveedores externos de infraestructura tecnológica (por ejemplo, servicios de
        almacenamiento en la nube y de notificaciones push) que procesan datos en nuestro nombre,
        bajo obligaciones contractuales de confidencialidad, y no para fines propios.
      </LegalP>

      <LegalH2>5. Uso de tecnologías de geolocalización</LegalH2>
      <LegalP>
        La aplicación solicita permiso de ubicación para poder asignarle tareas cercanas y
        verificar la cobertura de promotores por zona. Puede revocar este permiso desde la
        configuración de su celular, aunque esto puede limitar su capacidad de recibir o
        completar tareas.
      </LegalP>

      <LegalH2>6. Medidas de seguridad</LegalH2>
      <LegalUl>
        <li>Cifrado AES-256 de datos financieros (CLABE / número de tarjeta)</li>
        <li>Contraseñas protegidas con hash bcrypt, nunca almacenadas en texto plano</li>
        <li>Comunicación cifrada (HTTPS) entre la aplicación, el panel y nuestros servidores</li>
        <li>
          Control de acceso por roles: solo personal autorizado de Administración/Finanzas puede
          consultar un número de cuenta completo, y cada consulta queda registrada con fecha,
          hora y usuario
        </li>
      </LegalUl>

      <LegalH2>7. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</LegalH2>
      <LegalP>
        Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los
        utilizamos, y las condiciones del uso que les damos (Acceso). Asimismo, tiene derecho a
        solicitar la corrección de su información en caso de estar desactualizada, inexacta o
        incompleta (Rectificación); a que la eliminemos de nuestros registros cuando considere
        que no se está utilizando conforme a los principios y obligaciones aplicables
        (Cancelación); así como a oponerse al uso de sus datos para fines específicos
        (Oposición).
      </LegalP>
      <LegalP>Para ejercer cualquiera de estos derechos, puede:</LegalP>
      <LegalUl>
        <li>Enviar su solicitud al correo de contacto señalado en la sección 1</li>
        <li>Eliminar su cuenta directamente desde la aplicación, en "Mi Perfil"</li>
        <li>
          Eliminar su cuenta desde nuestro sitio web sin necesidad de abrir la aplicación:{" "}
          <a href="/eliminar-cuenta" className="text-primary font-medium underline">
            promotoriadigital.app/eliminar-cuenta
          </a>
        </li>
      </LegalUl>
      <LegalP>
        Al eliminar su cuenta, borramos de forma permanente e irreversible sus datos financieros
        (CLABE/tarjeta) de nuestros servidores. Su número de celular se conserva únicamente como
        identificador histórico, para no afectar la integridad de los registros contables de
        tareas y pagos ya realizados con otros usuarios de la plataforma; este dato no se utiliza
        para ningún otro fin tras la eliminación de su cuenta.
      </LegalP>

      <LegalH2>8. Autoridad de protección de datos</LegalH2>
      <LegalP>
        Si considera que su derecho a la protección de datos personales ha sido vulnerado, tiene
        derecho a acudir ante el Instituto Nacional de Transparencia, Acceso a la Información y
        Protección de Datos Personales (INAI) para hacer valer sus derechos.
      </LegalP>

      <LegalH2>9. Cambios al Aviso de Privacidad</LegalH2>
      <LegalP>
        Nos reservamos el derecho de actualizar este Aviso de Privacidad. Cualquier modificación
        será publicada en esta misma página y, de ser un cambio sustancial, se le notificará a
        través de la aplicación.
      </LegalP>
    </LegalPageLayout>
  )
}
