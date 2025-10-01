import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import mysql from "mysql2/promise";

export const prerender = false;

// Cargar variables de entorno usando import.meta.env (forma correcta en Astro)
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const SMTP_PASSWORD = import.meta.env.SMTP_PASSWORD;
const EMAIL_TO = import.meta.env.EMAIL_TO;
const DATABASE_URL = import.meta.env.DATABASE_URL;

// Crear conexión a la base de datos
async function getDbConnection() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL no está configurada");
  }
  return await mysql.createConnection(DATABASE_URL);
}

async function sendEmailWithSMTP(
  empresa: string,
  nombre: string,
  email: string,
  telefono: string
) {
  const transporter = nodemailer.createTransport({
    host: "cruzber.loading.es",
    port: 465,
    secure: true,
    auth: {
      user: "alertas@tandemsoftware.info",
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: '"TandemSoftware" <alertas@tandemsoftware.info>',
    to: EMAIL_TO || "info@tandemsoftware.es",
    subject: "Nueva inscripción desde la web",
    text: `
      Empresa: ${empresa}
      Nombre: ${nombre}
      Email: ${email}
      Teléfono: ${telefono}
    `,
    html: `
      <h3>Nueva inscripción recibida</h3>
      <p><strong>Empresa:</strong> ${empresa}</p>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
    `,
  });
}

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
    from: "TandemSoftware <onboarding@resend.dev>",
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

export const POST: APIRoute = async ({ request }) => {
  let dbSaved = false;
  let emailSent = false;

  try {
    const data = await request.formData();

    const empresa = data.get("empresa") as string;
    const nombre = data.get("nombre") as string;
    const email = data.get("email") as string;
    const telefono = data.get("telefono") as string;

    console.log("Datos recibidos:", { empresa, nombre, email, telefono });

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

    // Intentar primero con SMTP, si falla usar Resend como backup
    try {
      console.log("Intentando enviar email con SMTP...");
      await sendEmailWithSMTP(empresa, nombre, email, telefono);
      emailSent = true;
      console.log("✓ Email enviado exitosamente con SMTP");
    } catch (smtpError: any) {
      console.log("✗ SMTP falló:", smtpError.message);
      console.log("Intentando con Resend...");

      try {
        await sendEmailWithResend(empresa, nombre, email, telefono);
        emailSent = true;
        console.log("✓ Email enviado exitosamente con Resend");
      } catch (resendError: any) {
        console.error("✗ Resend también falló:", resendError.message);
        throw resendError;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Inscripción enviada correctamente",
        dbSaved,
        emailSent
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
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
          "Content-Type": "application/json"
        }
      }
    );
  }
};
