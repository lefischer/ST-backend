const conts_states = ["creado", "asignado", "coordinado", "en progreso", "terminado", "cerrado"]
const conts_roles = ["admin", "bot", "cliente", "tecnico", "supervisor"]
const conts_dates = ["2019-07-23T10:00:00Z", "2019-07-24T10:00:00Z", "2019-07-25T10:00:00Z", "2019-07-26T10:00:00Z"]
const types = ["hardware", "software"]
const service = ["incidente", "solicitud"]
const priority = ["alta", "media", "baja"]

async function createRoles(roles, models) {

    roles.forEach(async (role) => {
      await models.Role.create({
       role
      });
    })
}

async function createStates(states, models) {

    states.forEach(async (state) => {
      await models.State.create({
       state
      });
    })
}

async function createUser(models, username, email, password, phone, roles, client) {
  const user = await models.User.create({
    username,
    email,
    password,
    phone,
    clientId: client
  });

  roles.forEach(async (id) => {
    await models.UserRole.create({
      userId: user.id,
      roleId: id
    })
  });

  return user
}

async function createClient(name, address, email, phone, models) {
  return await models.Client.create({
    name: name,
    address: address,
    email: email,
    phone: phone,
  });
}

async function createTicket( type, service, priority, description, ownerId, clientId, models) {

  const state = await models.State.findOne({
    where: {
      state: "creado"
    }
  })

  const ticket = await models.Ticket.create({
    type,
    service,
    priority,
    description,
    ownerId,
    clientId,
    stateId: state.id,
  });

  await models.TicketState.create({
    ticketId: ticket.id,
    stateId: state.id,
  })

  await models.Chat.create({
    ticketId: ticket.id
  })

  return ticket;
}


export default (

  async (models) => {

    console.log("creando seeds");

    const states = await models.State.findAll()
    const roles = await models.Role.findAll()
    const users = await models.User.findAll()
    const clients = await models.Client.findAll()
    // const tickets = await models.Ticket.findAll()

    if (states.length == 0){
      console.log("creado estados");
      await createStates(conts_states, models)
    }

    if (roles.length == 0){
      console.log("roles roles");
      await createRoles(conts_roles, models)
    }

    if (users.length == 0){
      console.log("creado usuarios");
      await createUser(models,'bot', 'bot@st.com', "1234567", "-------", [2])
      await createUser(models,'admin', 'admin@st.com', "1234567", "-------", [1])
      await createUser(models,'joaquin', 'joaquin@st.com', "1234567", "993254594", [1, 4, 5])
      await createUser(models,'laura', 'laura@st.com', "1234567", "766733957", [1, 4, 5])
      await createUser(models,'sara', 'sara@st.com', "1234567", "766733957", [4, 5])
      await createUser(models,'felipe', 'felipe@st.com', "1234567", "766733957", [4, 5])

    }

    if (clients.length == 0) {
      console.log("creando clientes");

      const client0 = await createClient("ST - 1", "Mac Iver 125, santiago", "st@st.com", "1234564234", models)
      const u00 = await createUser(models,'juan', 'juan@st.com', "1234567", "6973376542", [3], client0.id)
      const u01 = await createUser(models,'pedro', 'pedro@st.com', "1234567", "6973376542", [3], client0.id)

      const client1 = await createClient("ST - 2", "Miraflores 383, Santiago,", "contacto@st.com", "+562 2372 3200", models)
      const u10 = await createUser(models,'oscar', 'oscar@st.com', "1234567", "6973376542", [3], client1.id)
      const u11 = await createUser(models,'jorge', 'jorge@st.com', "1234567", "6973376542", [3], client1.id)
      const u12 = await createUser(models,'rodrigo', 'rodrigo@st.com', "1234567", "6973376542", [3], client1.id)


      const client2 = await createClient("PUC san joaquin", "Av. Vicuña Mackenna 4860, Macul", "puc_sj@uc.cl", "1234564234", models)
      const u20 = await createUser(models,'lucas', 'lucas@st.com', "1234567", "6973376542", [3], client2.id)
      const u21 = await createUser(models,'marcelo', 'marcelo@st.com', "1234567", "6973376542", [3], client2.id)

      const c_users = [[u00, u01], [u10, u11, u12], [u20, u21]]

      const nTickets = Math.floor((Math.random() * 20) + 20)

      var i;
      for (i = 0; i < nTickets; i++) {
        const c =  Math.floor((Math.random() * 3));

        const u =  c_users[c][Math.floor((Math.random() * (c_users[c].length - 1)))].id

        const ticket = await createTicket(types[Math.floor((Math.random() *  (types.length -1)))],
                                          service[Math.floor((Math.random() * (service.length -1)))],
                                          priority[Math.floor((Math.random() * (priority.length -1)))],
                                          `ticket ${i}`, (u + 1), (c + 1), models);

        // asinar supervisor
        const s = Math.floor((Math.random() * 3) + 3)

        await ticket.update({supervisorId: s});

        // assignar a usuario
        var asignar = Math.random() >= 0.5;

        if (asignar){

          const state = await models.State.findOne({
            where: {
              state: "asignado"
            }
          });

          await ticket.update({stateId: state.id})

          let userId = Math.floor((Math.random() * 3) + 3);

          while ( userId == s ) {
            userId = Math.floor((Math.random() * 3) + 3);
          }

          await models.Assignation.create({
            userId: userId,
            ticketId: ticket.id,
            active: true,
          });

          // coordinar
          var coordinar = Math.random() >= 0.5;

          if (coordinar) {

            const datetime = Date.parse(conts_dates[Math.floor(Math.random() * conts_dates.length)])


            const state = await models.State.findOne({
              where: {
                state: "coordinado"
              }
            })

            await ticket.update({datetime, stateId: state.id})
          }
        }
      }
    }
  }
)
