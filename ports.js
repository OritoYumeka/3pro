const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

// Elmアプリケーションを開始します
var app = Elm.Main.init({
    node: document.getElementById('myapp')
});



const token = new SkyWayAuthToken({
  jti: uuidV4(),
  iat: nowInSec(),
  exp: nowInSec() + 60 * 60 * 24,
  scope: {
    app: {
      id: '23ef36a9-4922-48a9-97dc-65bb3702a892',
      turn: true,
      actions: ['read'],
      channels: [
        {
          id: '*',
          name: '*',
          actions: ['write'],
          members: [
            {
              id: '*',
              name: '*',
              actions: ['write'],
              publication: {
                actions: ['write'],
              },
              subscription: {
                actions: ['write'],
              },
            },
          ],

          sfuBots: [
            {
              actions: ['write'],
              forwardings: [
                {
                  actions: ['write'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}).encode('uhGGIRM3XPCv2CtBHhekDMXZHZ6YweDyLqAInBZG1Ac=');



(async () => {

    const data = await SkyWayStreamFactory.createDataStream();
    app.ports.sendXY.subscribe(function(p) {
	//console.log(p)
	data.write(p);
    });
    app.ports.join.subscribe(async (room) => {
	console.log(room)
	if (room === '') return;

	const context = await SkyWayContext.Create(token);
	const channel = await SkyWayRoom.FindOrCreate(context, {
	    type: 'p2p',
	    name: room
	});
	const me = await channel.join();
	app.ports.skywayId.send(me.id);
	console.log(channel.members);
	await me.publish(data);

	const subscribeAndAttach = async (publication) => {
	    if (publication.publisher.id === me.id) return;

            const { stream } = await me.subscribe(publication.id);

            stream.onData.add((data) => {
		app.ports.moveInfo.send(data);
            })
	};
	channel.publications.forEach(subscribeAndAttach);
	channel.onStreamPublished.add((e) => subscribeAndAttach(e.publication));
    });
    
})();
