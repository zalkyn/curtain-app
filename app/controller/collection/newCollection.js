import slugify from "react-slugify";

export const saveNewCollection = async (prisma, _formData) => {
  try {
    const formData = Object.fromEntries(_formData);
    const inputs = JSON.parse(_formData.get("inputs") || {});
    const listInputs = JSON.parse(_formData.get("listInputs") || {});
    const customizerId = _formData.get("customizerId");

    console.log("customizerId=============", customizerId);

    if (!inputs || inputs?.title === "" || inputs?.length < 1) {
      return "Invalid Inputs";
    }

    const collectionLists = listInputs?.map((input) => {
      return {
        title: input?.title,
        handle: slugify(input?.title),
        shortInfo: input?.shortInfo,
      };
    });

    const response_ = await prisma.collection.create({
      data: {
        title: inputs?.title,
        customizerId: parseInt(customizerId),
        handle: slugify(inputs?.title),
        info: inputs?.info,
        shortInfo: inputs?.shortInfo,
        collectionList: {
          createMany: {
            data: collectionLists,
          },
        },
      },
    });

    return response_;
  } catch (err) {
    console.log("error===", err);
    return null;
  }
};

export const saveCollectionList = async (prisma, _formData) => {
  try {
    const listData = JSON.parse(_formData.get("data") || []) || [];
    const collectionId = _formData.get("collectionId");

    const response = await prisma.collectionList.createMany({
      data: listData,
    });

    return {
      collectionId: collectionId,
      data: listData,
      response: response,
    };
  } catch (error) {
    console.log("list error ============= ", error);
    return null;
  }
};

export const deleteSingleCollection = async (prisma, _formData) => {
  try {
    const collectionId = parseInt(_formData.get("collectionId"));

    const response = await prisma.$transaction([
      prisma.collectionList.deleteMany({
        where: { collectionId: collectionId },
      }),
      prisma.collection.delete({ where: { id: collectionId } }),
    ]);

    return {
      collectionId: collectionId,
      response: response,
    };
  } catch (error) {
    console.log("collection delete error ============= ", error);
    return null;
  }
};

export const updateSingleCollection = async (prisma, _formData) => {
  try {
    const collectionId = parseInt(_formData.get("collectionId"));
    const data = JSON.parse(_formData.get("data"));

    const response = await prisma.collection.updateMany({
      where: { id: collectionId },
      data: data,
    });
    return {
      collectionId: collectionId,
      response: response,
    };
  } catch (error) {
    console.log("collection delete error ============= ", error);
    return null;
  }
};
