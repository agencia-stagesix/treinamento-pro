import { test, expect } from "@playwright/test";

test("trainer dashboard and alerts render", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "sb-token",
      JSON.stringify({ access_token: "token", refresh_token: "refresh" }),
    );
    localStorage.setItem(
      "sb-user",
      JSON.stringify({
        id: "trainer-1",
        tipo_usuario: "treinador",
        nome: "Trainer",
      }),
    );
  });

  await page.route("**/v1/dashboard/esquadrao", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            agente: { id: "agent-1", nome: "Aluno 1" },
            ultimo_peso: 80,
            treinou_hoje: true,
            registrou_refeicao_hoje: true,
            hidratacao_hoje_ml: 2000,
            hidratacao_meta_ml: 4000,
            readiness_hoje: 75,
            dias_sem_registro: 0,
            alertas_ativos: [],
          },
        ],
      }),
    });
  });

  await page.route("**/v1/dashboard/alertas**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.goto("/trainer/dashboard");
  await expect(page.getByRole("heading", { name: "Esquadrão" })).toBeVisible();
  await expect(page.getByText("Aluno 1")).toBeVisible();

  await page.goto("/trainer/alertas");
  await expect(page.getByText("Sem alertas não lidos")).toBeVisible();
});
