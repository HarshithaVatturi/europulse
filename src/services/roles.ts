import { getCollection } from 'astro:content';
import type { Role } from '@/types';

export async function getRoles(): Promise<Role[]> {
  const entries = await getCollection('roles');
  return entries.map((e) => e.data as Role);
}

export async function getRoleBySlug(slug: string): Promise<Role | undefined> {
  const roles = await getRoles();
  return roles.find((r) => r.slug.toLowerCase() === slug.toLowerCase() || r.id.toLowerCase() === slug.toLowerCase());
}

export async function getRolesByFunction(functionName: string): Promise<Role[]> {
  const roles = await getRoles();
  return roles.filter((r) => r.function.toLowerCase() === functionName.toLowerCase());
}
