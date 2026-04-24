import { test, expect } from "@playwright/test";

test("aluno inicia treino e visualiza contador", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "sb-token",
      JSON.stringify({ access_token: "token", refresh_token: "refresh" }),
    );
    localStorage.setItem(
      "sb-user",
      JSON.stringify({ id: "agent-1", tipo_usuario: "agente", nome: "Aluno" }),
    );
  });

  await page.route("**/v1/protocolos/treinamento/me/ativos", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "vinc-1",
            validade_em: "2099-12-31",
            template: { nome: "Treino A" },
          },
        ],
      }),
    });
  });

  // Register catch-all first — Playwright matches in LIFO order, so the
  // specific /start route registered below will take precedence over this one.
  await page.route(
    "**/v1/protocolos/treinamento/execucoes/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ok: true } }),
      });
    },
  );

  await page.route(
    "**/v1/protocolos/treinamento/execucoes/start",
    async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            execucao: { id: "exec-1" },
            itens: [
              {
                id: "item-1",
                exercicio: { nome: "Supino Reto" },
                repeticoes_planejadas: 10,
                descanso_planejado_seg: 30,
              },
            ],
          },
        }),
      });
    },
  );

  await page.goto("/protocolo");
  await expect(
    page.getByRole("heading", { name: "Treinamento" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Iniciar execução" }).click();
  await expect(page.getByText("Supino Reto")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar descanso" }).click();
  await expect(page.getByText("Descanso", { exact: true })).toBeVisible();
});
