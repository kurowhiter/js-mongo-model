class Field {
    static get STRING_TYPE() { return 'string_field_type' }
    static get NUMBER_TYPE() { return 'number_field_type' }
    static get DATE_TYPE() { return 'date_field_type' }
    static get OBJECTID_TYPE() { return 'objectid_field_type' }
    static get OBJECT_TYPE() { return 'object_field_type' }
    static get ARRAY_TYPE() { return 'array_field_type' }
    static get ENUM_TYPE() { return 'enum_field_type' }
    static get ANY_TYPE() { return 'any_field_type' }

    constructor ({ defaultValue, required, type, max, min, enums, itemTypes }) {
        this.defaultValue = defaultValue
        this.required = required
        this.type = type
        this.max = max
        this.min = min
        this.enums = enums
        this.itemTypes = itemTypes
    }

    parse(value) {
        if (value === undefined) return field.defaultValue || value

        if (field.type === Field.ANY_TYPE) {
            return value === undefined ? field.defaultValue : value
        }

        if (field.type === Field.STRING_TYPE) {
            return value === undefined ? field.defaultValue : `${value}`
        }

        if (field.type === Field.NUMBER_TYPE) {
            const numValue = parseFloat(v)
            return Number.isInteger(numValue) ? parseInt(numValue) : numValue
        }

        if (field.type === Field.DATE_TYPE) {
            let dateValue = value

            if (!(value instanceof Date)) {
                dateValue = new Date(value)
            }

            return dateValue
        }

        if (field.type === Field.OBJECTID_TYPE) {
            let oid = value

            if (!(oid instanceof ObjectId)) {
                if (!Number.isInteger(value)
                    || (`${value}`.length !== 12 && `${value}`.length !== 24)
                ) {
                    return undefined
                }

                oid = new ObjectId(value)
            }

            return oid
        }

        if (field.type === Field.OBJECT_TYPE) {
            return value
        }

        if (field.type === Field.ARRAY_TYPE) {
            return value
        }

        if (field.type === Field.ENUM_TYPE) {
            const v = value ?? field.defaultValue

            if (!field.enums.includes(v)) {
                return field.defaultValue || field.enums[0]
            }

            return v
        }

        return value
    }

    static field ({ defaultValue, required, type, max, min, enums }) {
        if (type === Field.ENUM_TYPE && (!enums || !enums.length)) {
            throw Error(`ENUM_TYPE require an array for param [enums]`)
        }

        if (!type) {
            type = Field.ANY_TYPE
        }

        return new Field({ defaultValue, required, type, max, min, enums })
    }

    static stringType({ defaultValue, required } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.STRING_TYPE,
        })
    }

    static numberType({ defaultValue, required, max, min } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.NUMBER_TYPE,
            max,
            min,
        })
    }

    static dateType({ defaultValue, required, max, min } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.DATE_TYPE,
            max,
            min,
        })
    }

    static objectidType({ defaultValue, required } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.OBJECTID_TYPE,
        })
    }

    static objectType({ defaultValue, required } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.OBJECT_TYPE,
        })
    }

    static arrayType({ defaultValue, required, itemTypes } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.ARRAY_TYPE,
            itemTypes,
        })
    }

    static enumsType({ defaultValue, required, enums } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.STRING_TYPE,
            enums,
        })
    }

    static anyType ({ defaultValue, required } = {}) {
        return new Field({
            defaultValue,
            required,
            type: Field.ANY_TYPE,
        })
    }
}

module.exports = {
    Field,
    field: Field.field,
}
