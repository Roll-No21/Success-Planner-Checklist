(function () {
  const COLUMNS = [
    { key: "chapter", label: "Chapter", type: "text" },
    { key: "lecture", label: "Lecture", type: "group", count: 10 },
    { key: "punch", label: "Punch", type: "cell" },
    { key: "pyqs", label: "PYQ's", type: "cell" },
    { key: "notes", label: "Notes", type: "cell" },
    { key: "dpps", label: "DPPs", type: "cell" },
    { key: "test", label: "Test", type: "group", count: 2 },
    { key: "rev1", label: "Rev-1", type: "cell" },
    { key: "rev2", label: "Rev-2", type: "cell" },
    { key: "rev3", label: "Rev-3", type: "cell" },
    { key: "rev4", label: "Rev-4", type: "cell" }
  ];

  const CHAPTERS = [
    "Some Basic Concepts of Chemistry",
    "Atomic Structure",
    "Solutions",
    "Chemical Kinetics",
    "Thermodynamics",
    "Electrochemistry",
    "Redox Reactions",
    "Equilibrium"
  ];

  function blankRow(id, chapter) {
    return {
      id,
      cells: {
        chapter,
        lecture: new Array(10).fill("empty"),
        punch: "empty", pyqs: "empty", notes: "empty", dpps: "empty",
        test: new Array(2).fill("empty"),
        rev1: "empty", rev2: "empty", rev3: "empty", rev4: "empty"
      }
    };
  }

  window.SUBJECT_DATA = {
    title: "Physical Chemistry",
    subtitle: "Chemistry",
    updatedDate: null,
    columns: COLUMNS,
    rows: CHAPTERS.map((c, i) => blankRow("physical_row_" + i, c))
  };

  window.SUBJECT_META = { subjectKey: "chemistry", partKey: "physical" };
})();
