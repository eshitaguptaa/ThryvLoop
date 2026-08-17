function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inviteFromAddress() {
  return (
    process.env.INVITE_EMAIL_FROM?.trim()
    || process.env.TEAMS_NOTIFY_FROM?.trim()
    || ''
  );
}

function buildInviteHtml({ inviterName, workspaceName, joinUrl, logoUrl }) {
  const who = escapeHtml(inviterName);
  const workspace = escapeHtml(workspaceName);
  const href = escapeHtml(joinUrl);
  const logo = escapeHtml(logoUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Join ${workspace} on ThryvLoop</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8e6f2;">
          <tr>
            <td style="padding:28px 32px 8px;">
              <img src="${logo}" alt="ThryvLoop" width="36" height="36" style="display:block;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#5D3FD3;font-weight:700;">ThryvLoop</p>
              <h1 style="margin:12px 0 0;font-size:24px;line-height:1.3;color:#16141f;font-weight:700;">
                ${who} invited you to ${workspace}
              </h1>
              <p style="margin:14px 0 0;font-size:16px;line-height:1.55;color:#3f3b4d;">
                Join this workspace to work together in one place — tasks, focus, and your team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px;font-family:Arial,Helvetica,sans-serif;">
              <a href="${href}" style="display:inline-block;background:#5D3FD3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 22px;border-radius:10px;">
                Join workspace
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b6578;">
                Use the same email this was sent to. If you weren’t expecting this, you can ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildInviteText({ inviterName, workspaceName, joinUrl }) {
  return [
    `${inviterName} invited you to join ${workspaceName} on ThryvLoop.`,
    '',
    'Join workspace:',
    joinUrl,
    '',
    'Use the same email this was sent to. If you were not expecting this, you can ignore it.',
  ].join('\n');
}

/**
 * Personal workspace invite. Reply-To is the inviter so Gmail treats it as
 * a person-to-person message (Primary) rather than a product newsletter.
 */
export async function sendWorkspaceInviteEmail({
  to,
  inviterName,
  inviterEmail,
  workspaceName,
  joinUrl,
  origin,
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, reason: 'missing_api_key' };

  const from = inviteFromAddress();
  if (!from) return { ok: false, reason: 'missing_from' };
  const logoUrl = `${String(origin || '').replace(/\/$/, '')}/LandingPageImages/logo.png`;
  const subject = `${inviterName} invited you to ${workspaceName}`;

  const payload = {
    from,
    to: [to],
    subject,
    html: buildInviteHtml({ inviterName, workspaceName, joinUrl, logoUrl }),
    text: buildInviteText({ inviterName, workspaceName, joinUrl }),
  };
  if (inviterEmail && inviterEmail.toLowerCase() !== to.toLowerCase()) {
    payload.reply_to = inviterEmail;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[inviteEmail] Resend failed:', detail);
    return { ok: false, reason: 'send_failed' };
  }

  return { ok: true };
}

export function hasInviteEmailProvider() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && inviteFromAddress());
}
