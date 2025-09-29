import type { APIRoute } from "astro";
import nodemailer from "nodemailer";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();

    const empresa = data.get("empresa") as string;
    const nombre = data.get("nombre") as string;
    const email = data.get("email") as string;
    const telefono = data.get("telefono") as string;

    const transporter = nodemailer.createTransport({
      host: "cruzber.loading.es",
      port: 465,
      secure: true,
      auth: {
        user: "alertas@tandemsoftware.info",
        pass: "tsESn1CQ9##",
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: '"TandemSoftware" <alertas@tandemsoftware.info>',
      to: "sergio@tandemsoftware.es",
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
