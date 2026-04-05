import { NotFoundException } from "@nestjs/common";
import { resolveId } from "./resolve-id.util";

describe("resolveId", () => {
	const makePool = () => ({ query: jest.fn() }) as any;

	it("returns UUID input without querying the database", async () => {
		const pool = makePool();
		const uuid = "11111111-2222-3333-4444-555555555555";

		const result = await resolveId(pool, "jobs", uuid);

		expect(result).toBe(uuid);
		expect(pool.query).not.toHaveBeenCalled();
	});

	it("resolves display_id values to UUIDs", async () => {
		const pool = makePool();
		pool.query.mockResolvedValue({ rows: [{ id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }] });

		const result = await resolveId(pool, "jobs", "jobabc12345");

		expect(result).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
		expect(pool.query).toHaveBeenCalledWith("SELECT id FROM jobs WHERE display_id = $1", ["JOBABC12345"]);
	});

	it("throws NotFoundException when display_id does not exist", async () => {
		const pool = makePool();
		pool.query.mockResolvedValue({ rows: [] });

		await expect(resolveId(pool, "jobs", "JOBXXXXYYYY")).rejects.toThrow(NotFoundException);
	});

	it("throws for non-whitelisted table names", async () => {
		const pool = makePool();

		await expect(resolveId(pool, "unsafe_table", "JOBXXXXYYYY")).rejects.toThrow("resolveId: unknown table");
	});
});
