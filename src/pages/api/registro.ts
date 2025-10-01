import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { Resend } from "resend";

export const prerender = false;

const resend = new Resend(process.env.RESEND_API_KEY);

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
    to: process.env.EMAIL_TO || "info@tandemsoftware.es",
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
  await resend.emails.send({
    from: "TandemSoftware <onboarding@resend.dev>",
    to: process.env.EMAIL_TO || "info@tandemsoftware.es",
    subject: "Nueva inscripción desde la web",
    html: `
      <h3>Nueva inscripción recibida</h3>
      <p><strong>Empresa:</strong> ${empresa}</p>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Teléfono:</strong> ${telefono}</p>
    `,
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();

    const empresa = data.get("empresa") as string;
    const nombre = data.get("nombre") as string;
    const email = data.get("email") as string;
    const telefono = data.get("telefono") as string;

    // Intentar primero con SMTP, si falla usar Resend como backup
    try {
      await sendEmailWithSMTP(empresa, nombre, email, telefono);
      console.log("Email enviado exitosamente con SMTP");
    } catch (smtpError) {
      console.log("SMTP falló, intentando con Resend...", smtpError);

      if (!process.env.RESEND_API_KEY) {
        throw new Error("SMTP falló y no hay configurada RESEND_API_KEY");
      }

      try {
        await sendEmailWithResend(empresa, nombre, email, telefono);
        console.log("Email enviado exitosamente con Resend");
      } catch (resendError) {
        console.error("Resend también falló:", resendError);
        throw resendError;
      }
    }

    return new Response(
      JSON.stringify({ message: "Inscripción enviada correctamente" }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error enviando email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || "Ocurrió un error al enviar la inscripción",
        code: error?.code || undefined,
      }),
      { status: 500 }
    );
  }
};
