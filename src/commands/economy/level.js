const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  AttachmentBuilder,
} = require('discord.js');
const canvacord = require('canvacord');
const calculateLevelXp = require('../../utils/calculateLevelXp');
const Level = require('../../models/Level');

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply('You can only run this command inside a server.');
      return;
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.get('target-user')?.value;
    const targetUserId = mentionedUserId || interaction.member.id;
    const targetMember = interaction.guild.members.cache.get(targetUserId);
    const targetUserObj = targetMember ? targetMember.user : null;

    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!fetchedLevel) {
      interaction.editReply(
        mentionedUserId
          ? `${targetUserObj.user.id} nu are inca niciun nivel. Incearca cand va vorbi umpic mai mult.`
          : "Nu ai inca niciun nivel. Vorbeste mai mult si incearca din nou."
      );
      return;
    }

    let allLevels = await Level.find({ guildId: interaction.guild.id }).select(
      '-_id userId level xp'
    );

    allLevels.sort((a, b) => {
      if (a.level === b.level) {
        return b.xp - a.xp;
      } else {
        return b.level - a.level;
      }
    });

    let currentRank = allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;

    const rank = new canvacord.Rank()
      .setAvatar(targetUserObj ? targetUserObj.displayAvatarURL({ size: 256 }) : '')
      .setRank(currentRank)
      .setLevel(fetchedLevel.level)
      .setCurrentXP(fetchedLevel.xp)
      .setRequiredXP(calculateLevelXp(fetchedLevel.level))
      .setStatus(targetUserObj ? targetUserObj.presence?.status || 'offline' : 'offline')
      .setProgressBar('#A200FF', 'COLOR')
      .setUsername(targetUserObj.username || 'Unknown User')
      .setDiscriminator(targetUserObj && targetUserObj.user && targetUserObj.user.discriminator ? targetUserObj.user.discriminator : '0000');

    const data = await rank.build();
    const attachment = new AttachmentBuilder(data);
    interaction.editReply({ files: [attachment] });
  },

  name: 'level',
  description: "Arata nivelul tau sau al altcuiva.",
  options: [
    {
      name: 'target-user',
      description: 'Persoana al carui nivel vrei sa i-l vezi.',
      type: ApplicationCommandOptionType.Mentionable,
    },
  ],
};
