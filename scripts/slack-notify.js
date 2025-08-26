import fetch from "node-fetch";

export default async function postPublishHook({ url, exp, ...rest }) {
  const webhookUrl = process.env.SLACK_WEBHOOK || process.env.EXPO_PUBLIC_SLACK_WEBHOOK;
  
  if (!webhookUrl) {
    console.warn("⚠️ Slack webhook URL niet geconfigureerd - notificatie wordt overgeslagen");
    return;
  }
  
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `✅ Nieuwe PulseGuard build gepubliceerd!\nNaam: ${exp.name}\nVersie: ${exp.version}\nPlatform: ${exp.platforms?.join(', ') || 'Onbekend'}\n🚀 Build succesvol afgerond!`
      })
    });
    console.log("✅ Slack notificatie verzonden");
  } catch (error) {
    console.error("❌ Fout bij verzenden Slack notificatie:", error);
  }
}