import { useNavigate } from 'react-router-dom';
import ReelRing from './ReelRing';

const STORIES = [
    {
        image: '/gallery/kitkat-drip.jpg',
        title: 'The KitKat Wall',
        text: "A barricade of chocolate fingers, a landslide of malt balls, and a confetti-rain of sprinkles — finished off with a polka-dot bow tied by hand. It's the kind of layered, textural build that turns a birthday cake into a centerpiece.",
    },
    {
        image: '/gallery/whiskey-drip.jpg',
        title: 'The Nightcap',
        text: 'A glossy dark-chocolate drip crowned with a mini spirits bar — gold-wrapped truffles, Oreos, and caramel bites arranged like a tiny celebration bar on top. Built for the one who has everything, and deserves a cake that knows it.',
    },
    {
        image: '/gallery/butterfly-tiered.jpg',
        title: 'Garden in Bloom',
        text: 'Three tiers, three techniques: hand-piped rosettes, a quilted pearl lattice, and butterflies caught mid-flight. Every layer is a different skill, stacked into one soft, romantic silhouette.',
    },
    {
        image: '/gallery/racecar-number.jpg',
        title: 'Pole Position',
        text: 'An entire race day sculpted into the shape of a number — hairpin turns of buttercream grass, a checkered finish line, and toy cars parked mid-lap. Built for a five-year-old speed demon who asked for exactly this.',
    },
    {
        image: '/gallery/minnie-tiered.jpg',
        title: "Minnie's Moment",
        text: "Soft buttercream clouds, a candy-pink number that towers over the top tier, and Minnie herself popping right off the fondant. Playful character work, scaled perfectly for a second birthday to remember.",
    },
];

const StoryGallery = () => {
    const navigate = useNavigate();

    return (
    <section
        className="px-6 py-12 md:py-16"
        style={{
            backgroundColor: '#F9E0D6',
            // Soft maroon vignette — a gentle fade of the dark brand colour at the edges.
            backgroundImage: 'radial-gradient(115% 85% at 50% 50%, transparent 52%, rgba(90,26,43,0.13) 100%)',
        }}
    >
        <div className="max-w-5xl mx-auto">
            <h2 className="font-baloo font-bold text-[30px] md:text-[40px] text-center mb-8 md:mb-12 flex items-center justify-center gap-3">
                <span className="twinkle text-maroon-shine text-[20px] md:text-[24px]">✦</span>
                <span className="text-maroon-shine">Every Cake Tells a Story</span>
                <span className="twinkle text-maroon-shine text-[20px] md:text-[24px]" style={{ animationDelay: '1.1s' }}>✦</span>
            </h2>

            <div className="flex flex-wrap justify-center items-start gap-x-6 gap-y-6 md:gap-x-8">
                {STORIES.map((s, i) => (
                    <figure
                        key={s.title}
                        className={`group bg-white p-2.5 pb-3 w-[150px] sm:w-[178px] shadow-[0_12px_28px_rgba(36,88,86,0.20)] transition-transform duration-300 ease-out hover:-translate-y-2 hover:rotate-0 hover:z-10 ${
                            i % 2 === 0 ? 'rotate-[-5deg]' : 'rotate-[5deg] sm:mt-10'
                        }`}
                    >
                        <div className="overflow-hidden">
                            <img
                                src={s.image}
                                alt={s.title}
                                className="w-full aspect-square object-cover"
                                loading="lazy"
                            />
                        </div>
                        <figcaption className="font-hand text-[20px] sm:text-[22px] leading-tight text-center pt-1.5 text-[#5A1A2B]">
                            {s.title}
                        </figcaption>
                    </figure>
                ))}
            </div>

            {/* CTA between the photo wall and the reel ring — jumps to the shop */}
            <div className="flex justify-center mt-10 md:mt-14">
                <button
                    onClick={() => navigate('/shop')}
                    className="px-9 py-4 rounded-full font-poppins text-[13.5px] md:text-[15px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_12px_30px_rgba(90,26,43,0.35)] hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(90,26,43,0.45)] transition-all cursor-pointer"
                    style={{ backgroundColor: '#5A1A2B' }}
                >
                    Explore the Offers Now
                </button>
            </div>

            {/* 3D rotating reel ring — auto-spins slowly, drag to flick like home screens */}
            <ReelRing />
        </div>
    </section>
    );
};

export default StoryGallery;
