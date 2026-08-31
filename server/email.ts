type AppointmentConfirmationEmail = {
  to: string;
  customerName: string;
  barberName: string;
  appointmentDate: string;
  startTime: string;
  serviceNames: string[];
};

function formatDateBr(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export async function sendAppointmentConfirmationEmail(
  data: AppointmentConfirmationEmail
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY não configurada.");
    return false;
  }

  const services = data.serviceNames.length
    ? data.serviceNames.join(", ")
    : "Serviço agendado";

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Street Barber Shop <agendamento@streetbarbershop.com.br>",
        to: [data.to],
        subject: "Agendamento confirmado — Street Barber Shop",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222">
            <h2>Agendamento confirmado ✂️</h2>

            <p>Olá, <strong>${data.customerName}</strong>!</p>

            <p>Seu horário na <strong>Street Barber Shop</strong> está confirmado.</p>

            <div style="padding:16px;border:1px solid #ddd;border-radius:8px">
              <p><strong>Barbeiro:</strong> ${data.barberName}</p>
              <p><strong>Data:</strong> ${formatDateBr(data.appointmentDate)}</p>
              <p><strong>Horário:</strong> ${data.startTime.slice(0, 5)}</p>
              <p><strong>Serviço(s):</strong> ${services}</p>
            </div>

            <p>Esperamos você! 💈</p>

            <p>
              <strong>Street Barber Shop</strong><br>
              Nonoai - RS
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "");
      console.error(
        `[Email] Falha ao enviar confirmação (${response.status}):`,
        error
      );
      return false;
    }

    console.log(`[Email] Confirmação enviada para ${data.to}`);
    return true;
  } catch (error) {
    console.error("[Email] Erro ao enviar confirmação:", error);
    return false;
  }
}
