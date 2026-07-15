import { describe, it, expect } from "vitest";
import { OPS_BY_DIMENSION, TARGETING_DIMENSIONS, isListOp, emptyTargetingRule, describeRule } from "./index";

describe("targeting helpers", () => {
  it("every dimension has at least one operator", () => {
    for (const d of TARGETING_DIMENSIONS) expect(OPS_BY_DIMENSION[d].length).toBeGreaterThan(0);
  });
  it("isListOp identifies multi-value operators", () => {
    expect(isListOp("contains_any")).toBe(true);
    expect(isListOp("in")).toBe(true);
    expect(isListOp("is")).toBe(false);
  });
  it("emptyTargetingRule is a valid interests rule", () => {
    expect(emptyTargetingRule()).toMatchObject({ dimension: "interests", op: "contains_any" });
  });
  it("describeRule renders readable text", () => {
    expect(describeRule({ dimension: "interests", op: "contains_any", value: ["food", "culture"] })).toBe("interests contains any of food, culture");
    expect(describeRule({ dimension: "nights", op: "gte", value: 5 })).toBe("nights gte 5");
  });
});
