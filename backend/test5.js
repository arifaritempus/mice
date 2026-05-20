const paginateArray = ({ items, page, pageSize }) => {
    const offset = (page - 1) * pageSize;
    const pageItems = items.slice(offset, offset + pageSize);
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    return { pageItems, total, totalPages };
};
console.log(paginateArray({ items: [1,2,3], page: 1, pageSize: 20 }));
