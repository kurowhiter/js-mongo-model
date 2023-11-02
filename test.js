const { Model } = require('./model')
const { Field } = require('./field')

const test = () => {
    class Mtest extends Model {
        f1 = Field.field({defaultValue: 1})
        f2 = Field.anyType({defaultValue: 2})
    
        constructor (...args) {
            super()
            this.init(...args)
        }
    }

    Mtest.insertMany(['a', 'b', 'c'].map((f2, i) => {
        return new Mtest({f1: i, f2})
    })).then((doc) => {
        console.log('result', doc)
        // return doc.delete().then((r) => {
        //     console.log('rrrrrrrrrrrrrrrrrr', r)
        // })
    })
    // const x = new Mtest()

    // x.save().then((result) => {
    //     console.log(result)
    // })
}

module.exports = { test }
