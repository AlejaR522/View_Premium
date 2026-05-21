import crypto from "crypto";

export const forgotPassword = async (req, res) => {

    try {

        const { correo } = req.body;

        const usuario = await User.findOne({ correo });

        if (!usuario) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        // Generar token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Fecha expiración (10 minutos)
        const resetTokenExpire = Date.now() + 10 * 60 * 1000;

        usuario.resetToken = resetToken;
        usuario.resetTokenExpire = resetTokenExpire;

        await usuario.save();

        res.status(200).json({
            message: "Token generado correctamente",
            resetToken
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Error del servidor"
        });

    }

};