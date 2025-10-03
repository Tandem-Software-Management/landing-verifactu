import type { APIRoute } from "astro";
// import nodemailer from "nodemailer";
import { Resend } from "resend";
import mysql from "mysql2/promise";

export const prerender = false;

// Cargar variables de entorno usando import.meta.env (forma correcta en Astro)
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
// const SMTP_PASSWORD = import.meta.env.SMTP_PASSWORD;
const EMAIL_TO = import.meta.env.EMAIL_TO;
const DATABASE_URL = import.meta.env.DATABASE_URL;
const RECAPTCHA_SECRET_KEY = import.meta.env.RECAPTCHA_SECRET_KEY;

// Verificar token de reCAPTCHA
async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!RECAPTCHA_SECRET_KEY) {
    throw new Error("RECAPTCHA_SECRET_KEY no está configurada");
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const data = await response.json();

    // reCAPTCHA v3 devuelve un score de 0.0 a 1.0
    // 1.0 es muy probablemente humano, 0.0 es muy probablemente bot
    // Recomendado: usar un threshold de 0.5
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error("Error verificando reCAPTCHA:", error);
    return false;
  }
}

// Crear conexión a la base de datoss
async function getDbConnection() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL no está configurada");
  }
  return await mysql.createConnection(DATABASE_URL);
}

// async function sendEmailWithSMTP(
//   empresa: string,
//   nombre: string,
//   email: string,
//   telefono: string
// ) {
//   const transporter = nodemailer.createTransport({
//     host: "cruzber.loading.es",
//     port: 465,
//     secure: true,
//     requireTLS: true,
//     auth: {
//       user: "no-reply@tandemsoftware.info",
//       pass: SMTP_PASSWORD,
//     },
//     tls: {
//       rejectUnauthorized: false,
//     },
//   });

//   await transporter.sendMail({
//     from: '"Tandem Software" <no-reply@tandemsoftware.info>',
//     to: EMAIL_TO || "info@tandemsoftware.es",
//     subject: "Nueva inscripción desde la web",
//     text: `
//       Empresa: ${empresa}
//       Nombre: ${nombre}
//       Email: ${email}
//       Teléfono: ${telefono}
//     `,
//     html: `
//       <h3>Nueva inscripción recibida</h3>
//       <p><strong>Empresa:</strong> ${empresa}</p>
//       <p><strong>Nombre:</strong> ${nombre}</p>
//       <p><strong>Email:</strong> ${email}</p>
//       <p><strong>Teléfono:</strong> ${telefono}</p>
//     `,
//   });
// }

// Email de notificación a la empresa
async function sendEmailWithResend(
  empresa: string,
  nombre: string,
  email: string,
  telefono: string
) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY no está configurada");
  }

  const resend = new Resend(RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: "Tandem Software <no-reply@tandemsoftware.info>",
    to: EMAIL_TO || "info@tandemsoftware.es",
    subject: "Nueva inscripción desde la web",
    html: `
      <h3>Nueva inscripción recibida</h3>
      <p><strong>Empresa:</strong> ${empresa}</p>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
}

// Email de confirmación al usuario
async function sendConfirmationEmailToUser(
  nombre: string,
  email: string
) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY no está configurada");
  }

  const resend = new Resend(RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: "Tandem Software <no-reply@tandemsoftware.info>",
    to: email,
    subject: "Confirmación de inscripción - Evento VeriFactu",
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Inscripción</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                    <!-- Banner -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <img src="https://res.cloudinary.com/dxkrekuq7/image/upload/v1759475725/Tandem_10_300ppp_lj0t2k.png" alt="Banner Evento VeriFactu" style="width: 100%; height: auto; display: block;">
                        </td>
                    </tr>

                    <!-- Contenido principal -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px; color: #333333; line-height: 1.6;">
                            <h2 style="color: #2563eb; margin-top: 0; margin-bottom: 20px; font-size: 24px;">¡Inscripción Recibida!</h2>

                            <p style="margin: 0 0 15px 0; font-size: 16px;">Hola <strong>${nombre}</strong>,</p>

                            <p style="margin: 0 0 15px 0; font-size: 16px;">¡Gracias por inscribirte en nuestro evento de integración a <strong>VeriFactu</strong>! Hemos recibido correctamente tu solicitud y en breve uno de nuestros compañeros se pondrá en contacto contigo por teléfono para confirmar tu asistencia y resolver cualquier duda que puedas tener.</p>

                            <p style="margin: 0 0 15px 0; font-size: 16px;">Además, recibirás un correo de confirmación con todos los detalles del acceso.</p>

                            <p style="margin: 0 0 25px 0; font-size: 16px;">Nos alegra contar contigo y esperamos verte muy pronto.</p>

                            <p style="margin: 0 0 5px 0; font-size: 16px;">Un saludo cordial,</p>
                            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #2563eb;">El equipo de Tandem Software</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f8f8f8; border-top: 1px solid #dddddd; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666666;">
                                <strong>Tandem Software Management SL</strong>
                            </p>
                            <p style="margin: 0 0 5px 0; font-size: 13px; color: #888888;">
                                Avda. de la Torrecilla S/N, Edif. La Torre II, Oficina 107 - 14013, Córdoba
                            </p>
                            <p style="margin: 0 0 5px 0; font-size: 13px; color: #888888;">
                                Teléfono: +34 957 248 361
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 13px; color: #888888;">
                                Email: info@tandemsoftware.es | www.tandemsoftware.es
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #999999;">
                                © 2025 Tandem Software. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
}

export const POST: APIRoute = async ({ request }) => {
  let dbSaved = false;
  let emailSent = false;
  let confirmationEmailSent = false;

  try {
    const data = await request.formData();

    const empresa = data.get("empresa") as string;
    const nombre = data.get("nombre") as string;
    const email = data.get("email") as string;
    const telefono = data.get("telefono") as string;
    const recaptchaToken = data.get("recaptcha_token") as string;

    console.log("Datos recibidos:", { empresa, nombre, email, telefono });

    // Verificar reCAPTCHA
    if (!recaptchaToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Token de verificación no encontrado",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidCaptcha) {
      console.log("✗ Verificación de reCAPTCHA falló");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Verificación de seguridad falló. Por favor, inténtalo de nuevo.",
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("✓ reCAPTCHA verificado exitosamente");

    // Guardar en la base de datos
    try {
      console.log("Intentando conectar a la base de datos...");
      const connection = await getDbConnection();
      await connection.execute(
        "INSERT INTO users (empresa, nombre, email, telefono) VALUES (?, ?, ?, ?)",
        [empresa, nombre, email, telefono]
      );
      await connection.end();
      dbSaved = true;
      console.log("✓ Usuario guardado en la base de datos");
    } catch (dbError: any) {
      console.error("✗ Error al guardar en la base de datos:", dbError.message);
      // Continuar con el envío de email aunque falle la BD
    }

    // Enviar email de notificación a la empresa
    try {
      console.log("Intentando enviar email de notificación a la empresa...");
      await sendEmailWithResend(empresa, nombre, email, telefono);
      emailSent = true;
      console.log("✓ Email de notificación enviado a la empresa");
    } catch (resendError: any) {
      console.log("✗ Error al enviar email de notificación:", resendError.message);
    }

    // Enviar email de confirmación al usuario
    try {
      console.log("Intentando enviar email de confirmación al usuario...");
      await sendConfirmationEmailToUser(nombre, email);
      confirmationEmailSent = true;
      console.log("✓ Email de confirmación enviado al usuario");
    } catch (confirmationError: any) {
      console.log("✗ Error al enviar email de confirmación:", confirmationError.message);
    }

    return new Response(
      JSON.stringify({
        message: "Inscripción enviada correctamente",
        dbSaved,
        emailSent,
        confirmationEmailSent,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("✗ Error general:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || "Ocurrió un error al enviar la inscripción",
        code: error?.code || undefined,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
