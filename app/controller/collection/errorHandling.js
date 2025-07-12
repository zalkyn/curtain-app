export const titleErrorHandling = (
  role = "button",
  title = "",
  collections = [],
) => {
  if (role === "button") {
    if (
      title.length < 1 ||
      collections?.find((c) =>
        c.title?.trim()?.toLowerCase()?.includes(title?.trim()?.toLowerCase()),
      )
    ) {
      return true;
    }
    return false;
  } else {
    if (title.length < 1) {
      return "Title at least 1 character!";
    }
    if (
      collections?.find(
        (c) => c.title?.trim()?.toLowerCase() === title?.trim()?.toLowerCase(),
      )
    ) {
      return `"${title}" already exists! Please try new one.`;
    }
  }
};

export const listErrorHandling = (
  value,
  field,
  index,
  collections = [],
  newInputs = [],
) => {
  if (value.length < 1) {
    return "Title at least 1 character!";
  }

  if (
    newInputs?.find(
      (input, i) =>
        input[field]?.trim()?.toLowerCase() === value?.trim()?.toLowerCase() &&
        index !== i,
    )
  ) {
    return `"${value}" already exists! Please try new one.`;
  }
};

export const collectionInputErrorHandling = (
  collections,
  collection,
  lists,
) => {
  if (
    collection?.title?.length < 1 ||
    collections?.find(
      (col) =>
        col?.title?.trim()?.toLowerCase() ===
        collection?.title?.trim()?.toLowerCase(),
    )
  ) {
    return {
      collection: true,
      list: true,
    };
  } else if (
    lists?.find((list) => list?.title?.length < 1) ||
    hasDuplicateTitles(lists)
  ) {
    return {
      collection: true,
      list: true,
    };
  } else {
    return {
      collection: false,
      list: false,
    };
  }
};

function hasDuplicateTitles(lists) {
  if (!lists || !Array.isArray(lists)) return false;

  const titles = lists
    .filter((list) => list?.title) // Filter out lists with no title
    .map((list) => list.title.toLowerCase()); // Normalize titles for comparison

  return new Set(titles).size !== titles.length; // Check if unique titles length differs
}
