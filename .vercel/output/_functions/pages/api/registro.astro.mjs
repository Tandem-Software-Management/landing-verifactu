import nodemailer from 'nodemailer';
import { Resend } from 'resend';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const resend = new Resend(process.env.RESEND_API_KEY);
async function sendEmailWithSMTP(empresa, nombre, email, telefono) {
  const transporter = nodemailer.createTransport({
    host: "cruzber.loading.es",
    port: 465,
    secure: true,
    auth: {
      user: "alertas@tandemsoftware.info",
      pass: process.env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
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
    `
  });
}
async function sendEmailWithResend(empresa, nombre, email, telefono) {
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
    `
  });
}
const POST = async ({ request }) => {
  try {
    const data = await request.formData();
    const empresa = data.get("empresa");
    const nombre = data.get("nombre");
    const email = data.get("email");
    const telefono = data.get("telefono");
    try {
      await sendEmailWithSMTP(empresa, nombre, email, telefono);
      console.log("Email enviado exitosamente con SMTP");
    } catch (smtpError) {
      console.log("SMTP falló, intentando con Resend...", smtpError);
      if (!process.env.RESEND_API_KEY) {
        throw new Error("SMTP falló y no hay configurada RESEND_API_KEY");
      }
      await sendEmailWithResend(empresa, nombre, email, telefono);
      console.log("Email enviado exitosamente con Resend");
    }
    return new Response(
      JSON.stringify({ message: "Inscripción enviada correctamente" }),
      {
        status: 200
      }
    );
  } catch (error) {
    console.error("Error enviando email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || "Ocurrió un error al enviar la inscripción",
        code: error?.code || void 0
      }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
