import reportReducer, { addReport, editReport, deleteReport } from "../reportSlice";

describe("reportSlice reducer", () => {
  const initialState = { reports: [] };

  it("should return the initial state", () => {
    expect(reportReducer(undefined, { type: "@@INIT" })).toEqual(initialState);
  });

  it("should handle addReport", () => {
    const newState = reportReducer(initialState, addReport({ title: "Test Report" }));
    expect(newState.reports.length).toBe(1);
    expect(newState.reports[0].title).toBe("Test Report");
    expect(newState.reports[0].status).toBe("pending");
  });

  it("should handle editReport", () => {
    const stateWithReport = {
      reports: [{ id: 1, title: "Old Title", status: "pending" }],
    };
    const newState = reportReducer(
      stateWithReport,
      editReport({ id: 1, updates: { title: "New Title" } })
    );
    expect(newState.reports[0].title).toBe("New Title");
  });

  it("should handle deleteReport", () => {
    const stateWithReport = {
      reports: [{ id: 1, title: "Delete Me", status: "pending" }],
    };
    const newState = reportReducer(stateWithReport, deleteReport(1));
    expect(newState.reports.length).toBe(0);
  });
});
