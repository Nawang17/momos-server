module.exports = (sequelize, DataTypes) => {
  const profilebanners = sequelize.define("profilebanners", {
    imageurl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imagekey: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  });

  profilebanners.associate = (models) => {
    profilebanners.belongsTo(models.users, {
      foreignKey: "userid",

      foreignKeyConstraint: true,
      onDelete: "CASCADE",
    });
  };
  return profilebanners;
};
