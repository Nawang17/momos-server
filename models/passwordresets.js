module.exports = (sequelize, DataTypes) => {
  const passwordresets = sequelize.define("passwordresets", {
    resettoken: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return passwordresets;
};
