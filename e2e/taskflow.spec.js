import { expect, test } from '@playwright/test';

// Parcours utilisateur de bout en bout dans un vrai navigateur :
// React -> proxy Vite -> API Express -> MongoDB.

const PASSWORD = 'MotDePasse123!';
let counter = 0;
const uniqueEmail = (name) => `${name}.${Date.now()}.${counter++}@example.test`;

async function register(page, email) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe (8 caractères minimum)').fill(PASSWORD);
  await page.getByLabel('Confirmer le mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('heading', { name: 'Mes tâches' })).toBeVisible();
}

async function createTask(page, { title, priority, dueDate }) {
  await page.getByLabel('Titre *').fill(title);
  if (priority) await page.getByLabel('Priorité', { exact: true }).first().selectOption(priority);
  if (dueDate) await page.getByLabel('Échéance', { exact: true }).first().fill(dueDate);
  await page.getByRole('button', { name: 'Ajouter la tâche' }).click();
  await expect(taskItem(page, title)).toBeVisible();
}

function taskItem(page, title) {
  return page
    .getByRole('list', { name: 'Liste des tâches' })
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: title }) });
}

test('une page privée redirige vers la connexion sans session', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});

test('parcours complet : compte, création, filtre, modification, persistance, suppression', async ({ page }) => {
  await register(page, uniqueEmail('alice'));
  await expect(page.getByText("Aucune tâche pour l'instant")).toBeVisible();

  await createTask(page, { title: 'Préparer la démo', priority: 'high', dueDate: '2030-01-15' });
  await createTask(page, { title: 'Relire le README', priority: 'low' });
  await expect(page.locator('.counter-main')).toContainText('2 tâches');

  // Filtre par priorité (bonus B1) : seule la tâche haute reste
  await page.getByLabel('Priorité', { exact: true }).last().selectOption('high');
  await expect(taskItem(page, 'Relire le README')).toHaveCount(0);
  await expect(taskItem(page, 'Préparer la démo')).toBeVisible();
  await page.getByRole('button', { name: 'Effacer les filtres' }).click();
  await expect(taskItem(page, 'Relire le README')).toBeVisible();

  // Modification du titre
  await page.getByRole('button', { name: 'Modifier « Préparer la démo »' }).click();
  const titleInput = page.getByRole('form', { name: 'Modifier la tâche' }).getByLabel('Titre *');
  await titleInput.fill('Préparer la soutenance');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(taskItem(page, 'Préparer la soutenance')).toBeVisible();

  // Changement de statut
  await page.getByLabel('Statut de « Préparer la soutenance »').selectOption('done');
  await expect(page.getByLabel('Statut de « Préparer la soutenance »')).toHaveValue('done');

  // Après rechargement, les données viennent toujours du serveur
  await page.reload();
  await expect(page.getByLabel('Statut de « Préparer la soutenance »')).toHaveValue('done');

  // Suppression avec confirmation
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Supprimer « Relire le README »' }).click();
  await expect(taskItem(page, 'Relire le README')).toHaveCount(0);
  await page.reload();
  await expect(taskItem(page, 'Relire le README')).toHaveCount(0);
});

test('isolation : le compte B ne voit pas les tâches du compte A', async ({ page }) => {
  await register(page, uniqueEmail('alice'));
  await createTask(page, { title: 'Tâche privée de A' });
  await page.getByRole('button', { name: 'Déconnexion' }).click();

  await register(page, uniqueEmail('bob'));
  await expect(page.getByText("Aucune tâche pour l'instant")).toBeVisible();
  await expect(page.getByText('Tâche privée de A')).toHaveCount(0);
});

test("erreurs lisibles : email déjà utilisé et mauvais mot de passe", async ({ page }) => {
  const email = uniqueEmail('carol');
  await register(page, email);
  await page.getByRole('button', { name: 'Déconnexion' }).click();

  await page.goto('/register');
  await page.getByLabel('Email').fill(email.toUpperCase());
  await page.getByLabel('Mot de passe (8 caractères minimum)').fill(PASSWORD);
  await page.getByLabel('Confirmer le mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Créer mon compte' }).click();
  await expect(page.getByRole('alert')).toContainText('déjà utilisée');

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill('MauvaisMotDePasse');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('alert')).toContainText('Email ou mot de passe incorrect');
});

test("habitude cochée puis visible dans la heatmap d'activité (bonus B2 et B3)", async ({ page }) => {
  await register(page, uniqueEmail('dave'));

  await page.getByRole('link', { name: 'Habitudes' }).click();
  await page.getByRole('textbox', { name: 'Nouvelle habitude' }).fill('Marcher 30 minutes');
  await page.getByRole('button', { name: 'Ajouter' }).click();

  const card = page.getByRole('listitem').filter({ hasText: 'Marcher 30 minutes' });
  const todayButton = card.locator('.period.current');
  await todayButton.click();
  await expect(todayButton).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toContainText('Série : 1 jour');

  await page.getByRole('link', { name: 'Activité' }).click();
  await expect(page.locator('.activity-summary')).toContainText('Total sur 12 mois1');
  await expect(page.locator('.heatmap-cell[data-value="1"]')).toHaveCount(1);
});
