import fetch from "node-fetch";

export default async function postPublishHook({ url, exp, ...rest }) {
  const webhookUrl = "https://hooks.slack.com/services/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";
  
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