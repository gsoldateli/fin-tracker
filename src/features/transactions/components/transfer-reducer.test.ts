import { describe, it, expect } from "vitest";
import {
  transferReducer,
  initialTransferState,
  type TransferState,
} from "./transfer-reducer";

describe("transferReducer", () => {
  it("select-account saves the account and goes back to the form step", () => {
    const state: TransferState = {
      ...initialTransferState,
      step: "pick-from",
    };

    const result = transferReducer(state, {
      type: "select-account",
      field: "from",
      id: "acc-1",
    });

    expect(result).toEqual({
      ...initialTransferState,
      step: "form",
      fromId: "acc-1",
    });
  });

  it("selecting an account already used in the other field clears that field", () => {
    const state: TransferState = {
      ...initialTransferState,
      fromId: "acc-1",
      toId: null,
    };

    const result = transferReducer(state, {
      type: "select-account",
      field: "to",
      id: "acc-1",
    });

    expect(result).toEqual({
      ...initialTransferState,
      step: "form",
      fromId: null,
      toId: "acc-1",
    });
  });

  it("swap exchanges source and destination", () => {
    const state: TransferState = {
      ...initialTransferState,
      fromId: "acc-1",
      toId: "acc-2",
    };

    const result = transferReducer(state, { type: "swap" });

    expect(result).toEqual({
      ...initialTransferState,
      fromId: "acc-2",
      toId: "acc-1",
    });
  });

  it("swap with one empty field moves the filled one to the other side", () => {
    const state: TransferState = {
      ...initialTransferState,
      fromId: "acc-1",
      toId: null,
    };

    const result = transferReducer(state, { type: "swap" });

    expect(result).toEqual({
      ...initialTransferState,
      fromId: null,
      toId: "acc-1",
    });
  });

  it("reset restores the initial state", () => {
    const state: TransferState = {
      step: "pick-to",
      fromId: "acc-1",
      toId: "acc-2",
      amountCents: 5000,
      description: "test",
    };

    const result = transferReducer(state, { type: "reset" });

    expect(result).toEqual(initialTransferState);
  });

  it("go-to-step changes only the step", () => {
    const state: TransferState = {
      ...initialTransferState,
      fromId: "acc-1",
      amountCents: 5000,
    };

    const result = transferReducer(state, {
      type: "go-to-step",
      step: "pick-from",
    });

    expect(result).toEqual({
      ...state,
      step: "pick-from",
    });
  });

  it("set-amount updates amountCents", () => {
    const result = transferReducer(initialTransferState, {
      type: "set-amount",
      cents: 15000,
    });

    expect(result.amountCents).toBe(15000);
  });

  it("set-description updates description", () => {
    const result = transferReducer(initialTransferState, {
      type: "set-description",
      value: "Description here",
    });

    expect(result.description).toBe("Description here");
  });
});
