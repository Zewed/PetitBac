"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/** Le client d'authentification du navigateur : lien e-mail et Google. */
export const authClient = createAuthClient();
