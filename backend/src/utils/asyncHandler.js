const asyncHandler = handleRequest => (req, res, next) => {
    Promise.resolve(handleRequest(req, res, next))
        .catch((error) => next(error))
}

export { asyncHandler }