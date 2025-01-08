class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObject = { ...this.queryString }; // hard copy of req.query
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObject[el]); //0-)el=page delete queryObject[page] and so on..

    console.log(queryObject);

    //1B) Advanced Filtering (lt,gt,lte,gte)
    let queryStr = JSON.stringify(queryObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy); //req.query.sort=price
      //sort('price ratingsAverage') we have to make it like this
    } else {
      this.query = this.query.sort('-createdAt'); //('-createdAt _id');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fieldsBy = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldsBy);
    } else {
      this.query = this.query.select('-__v'); // all of them except the __v
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1; // convert string to number
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=2&limit=10 1-10 page 1, 11-20 page 2, 21-30 page 3
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
