import { type Actions, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import sql from "$lib/db"

export const load: PageServerLoad = async ({ locals }) => {
  const { user } = locals
  const projects = await sql<{ id: string, name: string, trashed: boolean }[]>`select * from project where owner=${user.id} and trashed=false`
  return {
    projects
  }
}

export const actions: Actions = {
  create: async ({ locals, request }) => {
    try {
      const { user } = locals
      const data = await request.formData()
      const name = data.get("name")! as string
      const [potential_duplicate] = await sql`select name from project where name=${name} and owner=${user.id}`
      if (potential_duplicate) {
        return fail(400, { message: `You already have a project named ${name}`, name })
      }
      await sql` insert into project(name, owner) values( ${name}, ${user.id} )`
      return {
        name
      }
    } catch (error) {
      console.log(error)
      return fail(500)
    }
  },
  delete: async ({ locals, request }) => {
    try {
      const { user } = locals
      const data = await request.formData()
      const project = data.get("project")! as string
      await sql` delete from project where name=${project} and owner=${user.id}`
    } catch (error) {
      console.log(`Error while deleting project ${error}`)
      console.log(error)
      return fail(500)
    }
  },
  edit: async ({ locals, request }) => {
    try {
      const { user } = locals
      const data = await request.formData()
      const new_name = data.get("new_name")! as string
      const project = data.get("project")! as string
      const [potential_duplicate] = await sql` select name from project where name=${new_name} and owner=${user.id} `
      if (potential_duplicate) {
        return fail(409)
      }
      await sql` update project set name=${new_name} where name=${project} and owner=${user.id} `
    } catch (err) {
      console.log(`Error while editing project ${err}`)
      return fail(500)
    }
  }
}
