import { describe, expect, it } from "vitest";
import { SPEC_VERSION } from "@/core";

describe("프로젝트 설정", () => {
  it("판정 로직 모듈을 불러온다", () => {
    expect(SPEC_VERSION).toBe("04-spec");
  });
});
