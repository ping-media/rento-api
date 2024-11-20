const contactValidation = (contact) => {
    const pattern = /^\d{10}$/;
    return pattern.test(contact);
}

const emailValidation = (email) => {
    const pattern = /\S+@\S+\.\S+/;
    return pattern.test(email);
}


module.exports = {
    contactValidation,
    emailValidation
}