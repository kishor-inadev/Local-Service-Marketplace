import { BadRequestException } from "@nestjs/common";
import { StrictUuidPipe } from "./strict-uuid.pipe";

describe("StrictUuidPipe", () => {
  const pipe = new StrictUuidPipe();

  it("accepts UUID values and normalizes to lowercase", () => {
    expect(pipe.transform("A46A0454-8A66-4D72-A98A-EAAE52B7A8BC")).toBe(
      "a46a0454-8a66-4d72-a98a-eaae52b7a8bc",
    );
  });

  it("rejects display ID values", () => {
    expect(() => pipe.transform("JOB4R2F9HYZ")).toThrow(BadRequestException);
  });

  it("rejects empty values", () => {
    expect(() => pipe.transform("")).toThrow(BadRequestException);
  });
});
