export type TransferState = {
  step: "form" | "pick-from" | "pick-to";
  fromId: string | null;
  toId: string | null;
  amountCents: number;
  description: string;
};

export const initialTransferState: TransferState = {
  step: "form",
  fromId: null,
  toId: null,
  amountCents: 0,
  description: "",
};

export type TransferAction =
  | { type: "go-to-step"; step: TransferState["step"] }
  | { type: "select-account"; field: "from" | "to"; id: string }
  | { type: "swap" }
  | { type: "set-amount"; cents: number }
  | { type: "set-description"; value: string }
  | { type: "reset" };

export function transferReducer(
  state: TransferState,
  action: TransferAction,
): TransferState {
  switch (action.type) {
    case "go-to-step":
      return { ...state, step: action.step };

    case "select-account": {
      const otherField = action.field === "from" ? "toId" : "fromId";
      const selfField = action.field === "from" ? "fromId" : "toId";
      const otherId = state[otherField];
      return {
        ...state,
        step: "form",
        [selfField]: action.id,
        [otherField]: otherId === action.id ? null : otherId,
      };
    }

    case "swap":
      return {
        ...state,
        fromId: state.toId,
        toId: state.fromId,
      };

    case "set-amount":
      return { ...state, amountCents: action.cents };

    case "set-description":
      return { ...state, description: action.value };

    case "reset":
      return initialTransferState;

    default:
      return state;
  }
}
