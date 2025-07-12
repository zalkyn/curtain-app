import slugify from "react-slugify";

export const updateSingleSubCollection = async (prisma, _formData) => {
  try {
    const _updateList = JSON.parse(_formData.get("list")) || {};
    let listSlug = slugify(_updateList.title);

    const response = await prisma.collectionList.updateMany({
      where: {
        id: _updateList.id,
      },
      data: {
        title: _updateList.title,
        handle: listSlug,
        shortInfo: _updateList.shortInfo,
        info: _updateList?.info,
      },
    });

    return {
      _updateList: _updateList,
      listSlug: listSlug,
      response: response,
    };
  } catch (error) {
    console.log("collection list update error ============= ", error);
    return null;
  }
};

export const deleteSingleSubCollection = async (prisma, _formData) => {
  try {
    let listId_ = _formData.get("listId");
    console.log("listId_============", listId_);

    const response = await prisma.collectionList.deleteMany({
      where: {
        id: parseInt(listId_),
      },
    });
    return {
      listId: listId_,
      response: response,
    };
  } catch (err) {
    console.log("=====", err);
    return null;
  }
  throw redirect(`/app/collections?${url.searchParams.toString()}`);
};
