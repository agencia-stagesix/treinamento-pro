import { test, expect } from "@playwright/test";

function trainerAuth(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
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
}

test("trainer dashboard and alerts render", async ({ page }) => {
  await trainerAuth(page);

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

test("trainer exercicios page renders and opens modals", async ({ page }) => {
  await trainerAuth(page);

  await page.route("**/v1/dashboard/alertas**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route("**/v1/exercicios**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "ex-1",
            nome: "Supino Reto",
            grupo_muscular: "Peito",
            tags: [],
          },
        ],
      }),
    });
  });

  await page.route("**/v1/protocolos/treinamento/templates", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "tmpl-1",
            nome: "Série A",
            exercicios: [],
          },
        ],
      }),
    });
  });

  await page.goto("/trainer/exercicios");
  await expect(page.getByRole("heading", { name: "Exercícios" })).toBeVisible();
  await expect(page.getByText("Supino Reto")).toBeVisible();
  await expect(page.getByText("Série A")).toBeVisible();

  // Open Cadastrar Exercício modal
  await page.getByRole("button", { name: "Cadastrar Exercício" }).click();
  await expect(page.getByText("Cadastrar Exercício").first()).toBeVisible();

  // Reload to close modal state, then open Série modal
  await page.goto("/trainer/exercicios");
  await page.waitForSelector("text=Supino Reto");
  await page.getByRole("button", { name: "Cadastrar Série" }).click();
  await expect(page.getByText("Cadastrar Série").first()).toBeVisible();
});
