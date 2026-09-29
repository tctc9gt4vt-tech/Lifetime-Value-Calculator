# Global Handset Value Model: Vercel setup

The site opens with a password screen. The FDM PULSE standard is built in, encrypted with the team password, so
nothing readable from PULSE sits in this folder, the GitHub repository or the deployed files. When someone uploads
newer PULSE files and chooses **Replace the team standard**, the new standard is encrypted in their browser and kept
in a private Vercel Blob store, and everyone gets it the next time they open the tool.

## One-off setup (about five minutes)

1. **Deploy this whole folder** (including `api/`, `package.json` and `vercel.json`), as you do now.
2. **Add the password.** In the Vercel project, open **Settings → Environment Variables** and add
   `TEAM_PASSWORD` with the team password (the one given with this build). Tick Production and Preview.
3. **Create the store.** Open the project's **Storage** tab → **Create** → **Blob**, set access to **Private**,
   and connect it to this project. Vercel adds the store's credentials to the project for you.
4. **Redeploy** (Deployments → the latest one → Redeploy) so the function picks up the variable and the store.

Without steps 2–4 the tool still works with the built-in standard; only **Replace the team standard** will say
that shared saving isn't set up.

## Keep in mind

- **The password is the only lock.** Anyone with the link and the password can open the tool and see the PULSE data.
  Share it only inside the team.
- **Keep the GitHub repository private.** The PULSE data in it is encrypted, but the password protects everything, so
  there's no reason to make the code public.
- **Changing the password** needs a rebuild of the page (the built-in standard is encrypted with it) and a new
  `TEAM_PASSWORD` value. Ask Claude for a rebuild with the new password, then update the variable and redeploy.
- **Every replaced standard is kept** in the Blob store under `pulse-standard/history/`, in case one needs restoring.
- **"Remember on this device"** keeps the password in that browser. Don't tick it on shared computers.
