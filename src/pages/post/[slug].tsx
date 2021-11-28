import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';
import { PostFormatter } from '../../utils/PostFormatter';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

type Post = {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
};

type PostProps = {
  post: Post;
};

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const estimatedReadingTime = (content: typeof post.data.content): number => {
    const wordsPerMinute = 200;

    const words = content
      .map(({ heading, body }) => {
        const totalOfWordsInTheHeading = heading.split(' ').length;
        const totalOfWordsInTheBody = body[0].text.split(' ').length;

        return totalOfWordsInTheHeading + totalOfWordsInTheBody;
      })
      .reduce((acc, curr) => acc + curr, 0);

    return Math.ceil(words / wordsPerMinute);
  };

  const POST_FORMATTED = PostFormatter(post);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>Post | {POST_FORMATTED.data.title}</title>
      </Head>

      <main>
        <div className={`${styles.headerWrapper} ${commonStyles.wrapper}`}>
          <Header />
        </div>
        <div className={styles.bannerWrapper}>
          <div>
            <img src={POST_FORMATTED.data.banner.url} alt="banner" />
          </div>
        </div>
        <section className={`${styles.section} ${commonStyles.wrapperWithTop}`}>
          <header>
            <h1 className={styles.title}>{POST_FORMATTED.data.title}</h1>

            <div className={styles.info}>
              <div>
                <FiCalendar />
                <span>{POST_FORMATTED.first_publication_date}</span>
              </div>

              <div>
                <FiUser />
                <span>{POST_FORMATTED.data.author}</span>
              </div>

              <div>
                <FiClock />
                <span>
                  {estimatedReadingTime(POST_FORMATTED.data.content)} min
                </span>
              </div>
            </div>
          </header>

          <article>
            {POST_FORMATTED.data.content.map(content => (
              <section className={styles.content} key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: content.body[0].text,
                  }}
                />
              </section>
            ))}
          </article>
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      { params: { slug: 'como-utilizar-hooks' } },
      { params: { slug: 'criando-um-app-cra-do-zero' } },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const slug = context.params.slug as string;

  const response = await prismic.getByUID('posts', slug, {});
  return {
    props: {
      post: {
        uid: response.uid,
        first_publication_date: response.first_publication_date,
        data: {
          title: response.data.title1 || response.data.title,
          banner: { url: response.data.banner.url },
          author: response.data.author,
          subtitle: response.data.subtitle1 || response.data.subtitle,
          content: response.data.content,
        },
      },
    },
  };
};
