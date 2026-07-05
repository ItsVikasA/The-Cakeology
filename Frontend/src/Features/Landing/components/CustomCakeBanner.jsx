import { useNavigate } from 'react-router-dom';

const RIBBON = 'CUSTOMISE CAKE HERE   ✦   ';

/**
 * Custom-cake promo:
 * - Golden "CUSTOMISE CAKE HERE" ribbon sweeps diagonally (30°) BEHIND the image as one
 *   continuous band whose start/end run off both screen edges (clipped by section overflow).
 * - Polaroid-framed promo image on the LEFT, premium silver CTA button on the RIGHT.
 *   Both route to /customCake.
 */
const CustomCakeBanner = () => {
    const navigate = useNavigate();

    return (
        <section
            className="relative overflow-hidden px-6 py-16 md:py-24"
            style={{
                backgroundColor: '#F9E0D6',
                // Soft maroon vignette — a gentle fade of the dark brand colour at the edges.
                backgroundImage: 'radial-gradient(115% 85% at 50% 50%, transparent 52%, rgba(90,26,43,0.13) 100%)',
            }}
        >
            {/* Full-width diagonal golden ribbon (30°) — ends run off-screen, behind everything */}
            <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                <div
                    className="w-[200%] rotate-[-30deg] overflow-hidden shadow-[0_10px_30px_rgba(170,119,28,0.35)]"
                    style={{ background: 'linear-gradient(90deg,#bf953f,#fcf6ba,#b38728,#fbf5b7,#aa771c,#fcf6ba,#bf953f)' }}
                >
                    <div className="flex w-max animate-[marquee_22s_linear_infinite] py-3 md:py-3.5">
                        <span className="font-baloo font-extrabold text-[17px] md:text-[23px] tracking-[0.18em] whitespace-nowrap text-[#5a3d0a]">
                            {RIBBON.repeat(30)}
                        </span>
                        <span className="font-baloo font-extrabold text-[17px] md:text-[23px] tracking-[0.18em] whitespace-nowrap text-[#5a3d0a]" aria-hidden="true">
                            {RIBBON.repeat(30)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Foreground: polaroid image left, silver button right */}
            <div className="relative z-10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-6 md:gap-14">

                {/* Transparent teddy — floats free (no polaroid frame). */}
                <div
                    onClick={() => navigate('/customCake')}
                    className="group relative shrink-0 cursor-pointer transition-transform duration-300 hover:-translate-y-1 sm:-ml-4 md:-ml-12 lg:-ml-16"
                >
                    <img
                        src="/custom-cake-bear.png"
                        alt="We make custom cakes at The Cakeology Bagalkot"
                        className="block w-[310px] sm:w-[380px] md:w-[480px] drop-shadow-[0_18px_28px_rgba(90,26,43,0.28)]"
                    />
                </div>

                {/* Premium silver CTA button */}
                <div className="text-center sm:text-left shrink-0">
                    <button
                        onClick={() => navigate('/customCake')}
                        className="premium-silver-btn group inline-flex items-center gap-2
                                   px-5 md:px-10 py-3.5 md:py-5 rounded-full cursor-pointer
                                   font-poppins text-[11px] sm:text-[11.5px] md:text-[15px] font-bold uppercase tracking-[0.12em]"
                    >
                        <span>Make Your Custom Cake</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CustomCakeBanner;
