import { BadRequestException } from "@nestjs/common";
import { FlexibleIdPipe } from "./flexible-id.pipe";

describe("FlexibleIdPipe", () => {
  const pipe = new FlexibleIdPipe();

  it("normalizes UUID values to lowercase", () => {
    const value = pipe.transform("AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE");
    expect(value).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  });

  it("normalizes display IDs to uppercase", () => {
    const value = pipe.transform("jobabc12345");
    expect(value).toBe("JOBABC12345");
  });

  it("rejects malformed values", () => {
    expect(() => pipe.transform("not-a-valid-id")).toThrow(BadRequestException);
  });
});
